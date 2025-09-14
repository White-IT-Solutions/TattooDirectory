import { GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { ScanCommand, QueryCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import CircuitBreaker from "opossum";
import http from "http";
import { createLogger } from "../../common/logger.js";
import {
  createOpenSearchClient,
  createSecretsManagerClient,
  createDynamoDBClient,
  getIndexName,
  getTableName,
  config,
} from "../../common/aws-config.js";

// --- Client Initialization ---
// Cache the secret and client outside the handler for reuse
let osClient;
let dynamoClient;
const secretsManagerClient = createSecretsManagerClient();

/**
 * Make HTTP request to OpenSearch (LocalStack compatible)
 */
function makeOpenSearchRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const endpoint =
      process.env.OPENSEARCH_ENDPOINT || "http://localstack:4566";
    const url = new URL(endpoint);

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // For LocalStack, add the Host header for proper routing
    if (endpoint.includes("localstack")) {
      options.headers["Host"] =
        "tattoo-directory-local.eu-west-2.opensearch.localstack";
    }

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers["Content-Length"] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function getOpenSearchClient() {
  if (osClient) {
    return osClient;
  }
  try {
    if (config.isLocal) {
      // Local development - use default LocalStack credentials
      osClient = createOpenSearchClient();
      return osClient;
    }

    // Production - fetch the OpenSearch password from Secrets Manager
    const secretValue = await secretsManagerClient.send(
      new GetSecretValueCommand({ SecretId: process.env.APP_SECRETS_ARN })
    );
    const secrets = JSON.parse(secretValue.SecretString);

    osClient = createOpenSearchClient({
      password: secrets.opensearch_master_password,
    });
    return osClient;
  } catch (error) {
    throw error;
  }
}

function getDynamoDBClient() {
  if (!dynamoClient) {
    dynamoClient = createDynamoDBClient();
  }
  return dynamoClient;
}

// --- Circuit Breaker Configuration ---
const circuitBreakerOptions = {
  timeout: 3000, // If the function doesn't resolve in 3 seconds, trigger a failure
  errorThresholdPercentage: 50, // If 50% of requests fail, trip the circuit
  resetTimeout: 30000, // After 30 seconds, let one request through to test recovery
};

// The protected function that the circuit breaker will wrap
const protectedSearch = async (searchParams) => {
  const client = await getOpenSearchClient();
  return client.search(searchParams);
};

const breaker = new CircuitBreaker(protectedSearch, circuitBreakerOptions);

// Define a fallback action for when the circuit is open
breaker.fallback(() => ({
  // This structure will be caught and formatted into a proper HTTP response below
  isFallback: true,
  statusCode: 503,
  body: {
    type: "https://api.tattoodirectory.com/docs/errors#503",
    title: "Service Unavailable",
    status: 503,
    detail:
      "The search service is temporarily unavailable. Please try again later.",
  },
}));

// --- DynamoDB Fallback Functions ---
async function searchArtistsInDynamoDB(query, style, location, limit = 20, from = 0) {
  const client = getDynamoDBClient();
  const tableName = getTableName();
  
  try {
    // Use scan operation to get all artists (not ideal for production, but works for fallback)
    const scanParams = {
      TableName: tableName,
      FilterExpression: "begins_with(PK, :artistPrefix) AND (SK = :profileSK OR begins_with(SK, :artistPrefix))",
      ExpressionAttributeValues: marshall({
        ":artistPrefix": "ARTIST#",
        ":profileSK": "PROFILE"
      }),
      Limit: limit + from // Get more items to handle pagination
    };

    const result = await client.send(new ScanCommand(scanParams));
    let artists = result.Items ? result.Items.map(item => unmarshall(item)) : [];

    // Apply client-side filtering (not ideal, but necessary for fallback)
    if (query) {
      const queryLower = query.toLowerCase();
      artists = artists.filter(artist => 
        artist.artistName?.toLowerCase().includes(queryLower) ||
        artist.instagramHandle?.toLowerCase().includes(queryLower) ||
        artist.studioInfo?.studioName?.toLowerCase().includes(queryLower)
      );
    }

    if (style) {
      const styleLower = style.toLowerCase();
      artists = artists.filter(artist => 
        artist.styles && artist.styles.some(s => 
          s.toLowerCase() === styleLower || s.toLowerCase().includes(styleLower)
        )
      );
    }

    if (location) {
      const locationLower = location.toLowerCase();
      artists = artists.filter(artist => 
        artist.locationDisplay?.toLowerCase().includes(locationLower) ||
        artist.studioInfo?.location?.toLowerCase().includes(locationLower)
      );
    }

    // Apply pagination
    const paginatedArtists = artists.slice(from, from + limit);

    return {
      artists: paginatedArtists,
      total: artists.length
    };
  } catch (error) {
    throw new Error(`DynamoDB fallback search failed: ${error.message}`);
  }
}

async function getArtistFromDynamoDB(artistId) {
  const client = getDynamoDBClient();
  const tableName = getTableName();
  
  try {
    // Try with PROFILE SK first (test data format)
    let getParams = {
      TableName: tableName,
      Key: marshall({
        PK: `ARTIST#${artistId}`,
        SK: "PROFILE"
      })
    };

    let result = await client.send(new GetItemCommand(getParams));
    
    if (result.Item) {
      return unmarshall(result.Item);
    }

    // Try with ARTIST# SK format (production format)
    getParams = {
      TableName: tableName,
      Key: marshall({
        PK: `ARTIST#${artistId}`,
        SK: `ARTIST#${artistId}`
      })
    };

    result = await client.send(new GetItemCommand(getParams));
    
    if (!result.Item) {
      return null;
    }

    return unmarshall(result.Item);
  } catch (error) {
    throw new Error(`DynamoDB fallback get artist failed: ${error.message}`);
  }
}

async function getStylesFromDynamoDB() {
  const client = getDynamoDBClient();
  const tableName = getTableName();
  
  try {
    // Scan all artists to aggregate styles
    const scanParams = {
      TableName: tableName,
      FilterExpression: "begins_with(PK, :artistPrefix) AND (SK = :profileSK OR begins_with(SK, :artistPrefix))",
      ExpressionAttributeValues: marshall({
        ":artistPrefix": "ARTIST#",
        ":profileSK": "PROFILE"
      }),
      ProjectionExpression: "styles"
    };

    const result = await client.send(new ScanCommand(scanParams));
    const artists = result.Items ? result.Items.map(item => unmarshall(item)) : [];

    // Aggregate styles and count occurrences
    const styleCount = {};
    artists.forEach(artist => {
      if (artist.styles && Array.isArray(artist.styles)) {
        artist.styles.forEach(style => {
          styleCount[style] = (styleCount[style] || 0) + 1;
        });
      }
    });

    // Convert to array format and sort by count
    const styles = Object.entries(styleCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return styles;
  } catch (error) {
    throw new Error(`DynamoDB fallback get styles failed: ${error.message}`);
  }
}

// --- RFC 9457 Error Response Helper ---
function createErrorResponse(statusCode, title, detail, instance, type = null) {
  const errorType =
    type || `https://api.tattoodirectory.com/docs/errors#${statusCode}`;

  return {
    statusCode,
    headers: { "Content-Type": "application/problem+json" },
    body: JSON.stringify({
      type: errorType,
      title,
      status: statusCode,
      detail,
      instance,
    }),
  };
}

function createSuccessResponse(data, pagination = null) {
  const response = {
    items: Array.isArray(data) ? data : [data],
    total: Array.isArray(data) ? data.length : 1
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(response),
  };
}

// --- Route Handlers ---
async function handleSearchArtists(event, logger) {
  try {
    const query = event.queryStringParameters?.query;
    const style = event.queryStringParameters?.style;
    const location = event.queryStringParameters?.location;

    // Require at least one search parameter
    const isSearchRequest = !!(query || style || location);
    
    if (!isSearchRequest) {
      logger.warn("Search request missing required parameters");
      return createErrorResponse(
        400,
        "Bad Request",
        "At least one search parameter is required.",
        event.requestContext.requestId
      );
    }
    
    console.log(
      "DEBUG: isSearchRequest =",
      isSearchRequest,
      "query =",
      query,
      "style =",
      style,
      "location =",
      location
    );

    // Try OpenSearch first, fall back to DynamoDB if unavailable
    let useOpenSearch = true;
    try {
      await getOpenSearchClient();
      logger.info("Successfully initialized OpenSearch client");
    } catch (error) {
      logger.warn("OpenSearch client initialization failed, falling back to DynamoDB", {
        error: error.toString(),
        endpoint: process.env.OPENSEARCH_ENDPOINT,
      });
      useOpenSearch = false;
    }

    // Handle pagination parameters
    const limit = Math.min(
      parseInt(event.queryStringParameters?.limit) || 20,
      50
    );
    const page = Math.max(parseInt(event.queryStringParameters?.page) || 1, 1);
    const from = (page - 1) * limit;

    let searchQuery;

    if (isSearchRequest) {
      // Build search query based on available parameters
      const mustClauses = [];
      const filterClauses = [];

      if (query) {
        // Use multi-match to search across multiple fields
        mustClauses.push({
          multi_match: {
            query: query,
            fields: [
              "artistName^2",
              "studioInfo.studioName",
              "instagramHandle",
            ],
            type: "best_fields",
            fuzziness: "AUTO",
          },
        });
      }

      if (style) {
        // Use terms query to match any of the artist's styles
        filterClauses.push({
          terms: {
            styles: [style.toLowerCase(), style],
          },
        });
      }

      if (location) {
        // Search in location field with some fuzziness
        mustClauses.push({
          match: {
            locationDisplay: {
              query: location,
              fuzziness: "AUTO",
            },
          },
        });
      }

      searchQuery = {
        query: {
          bool: {
            must: mustClauses.length > 0 ? mustClauses : [{ match_all: {} }],
            filter: filterClauses,
          },
        },
        size: limit,
        from: from,
        sort: [
          { rating: { order: "desc", missing: "_last" } },
          { reviewCount: { order: "desc", missing: "_last" } },
          "_score",
        ],
      };
    } else {
      // Return all artists with pagination, sorted by rating
      searchQuery = {
        query: {
          match_all: {},
        },
        size: limit,
        from: from,
        sort: [
          { rating: { order: "desc", missing: "_last" } },
          { reviewCount: { order: "desc", missing: "_last" } },
        ],
      };
    }

    const searchParams = {
      index: getIndexName(),
      body: searchQuery,
    };

    logger.info(
      "Performing artist search directly (bypassing circuit breaker for debugging)",
      {
        searchParams: searchParams,
        hasQuery: !!query,
        hasStyle: !!style,
        hasLocation: !!location,
      }
    );

    let result;
    let artists = [];

    if (!useOpenSearch) {
      // Use DynamoDB fallback
      logger.info("Using DynamoDB fallback for search", {
        hasQuery: !!query,
        hasStyle: !!style,
        hasLocation: !!location,
      });

      try {
        const dynamoResult = await searchArtistsInDynamoDB(query, style, location, limit, from);
        artists = dynamoResult.artists.map(artist => ({
          artistId: artist.artistId,
          name: artist.artistName,
          instagramHandle: artist.instagramHandle,
          location: artist.locationDisplay,
          styles: artist.styles || [],
          specialties: artist.specialties || [],
          rating: artist.rating,
          reviewCount: artist.reviewCount,
          portfolioImages: artist.portfolioImages || [],
          contactInfo: artist.contactInfo || {},
          studioInfo: artist.studioInfo || {},
          studioName: artist.studioInfo?.studioName || "Unknown Studio",
          pricing: artist.pricing || {},
          availability: artist.availability || {},
          experience: artist.experience || {},
          geohash: artist.geohash,
          latitude: artist.latitude,
          longitude: artist.longitude,
          updatedAt: artist.updatedAt,
          createdAt: artist.createdAt,
        }));

        logger.info("DynamoDB fallback search completed successfully", {
          resultCount: artists.length,
          totalHits: dynamoResult.total,
        });

        return createSuccessResponse(artists);
      } catch (error) {
        logger.error("DynamoDB fallback search failed", {
          error: error.toString(),
        });
        return createErrorResponse(
          500,
          "Internal Server Error",
          "Search service is currently unavailable.",
          event.requestContext.requestId
        );
      }
    }

    logger.info("DEBUG: Checking config.isLocal for search", {
      isLocal: config.isLocal,
      configKeys: Object.keys(config),
      config: config,
    });

    if (config.isLocal) {
      // Use HTTP requests for LocalStack
      try {
        logger.info("Using HTTP requests for LocalStack OpenSearch", {
          indexName: getIndexName(),
        });

        // Perform search directly
        result = await makeOpenSearchRequest(
          "POST",
          `/${getIndexName()}/_search`,
          searchQuery
        );

        // Wrap result to match OpenSearch client format
        result = {
          body: result,
          hits: result.hits,
        };

        logger.info("LocalStack OpenSearch query successful", {
          totalHits:
            result.body.hits?.total?.value || result.body.hits?.total || 0,
        });

        // Check if OpenSearch returned empty results or malformed response
        const hasValidHits = result.body && result.body.hits && result.body.hits.hits;
        if (!hasValidHits) {
          logger.warn("OpenSearch returned empty or malformed response, falling back to DynamoDB", {
            indexName: getIndexName(),
            responseBody: result.body,
          });
          
          // Fall back to DynamoDB
          try {
            const dynamoResult = await searchArtistsInDynamoDB(query, style, location, limit, from);
            artists = dynamoResult.artists.map(artist => ({
              artistId: artist.artistId,
              name: artist.artistName,
              instagramHandle: artist.instagramHandle,
              location: artist.locationDisplay,
              styles: artist.styles || [],
              specialties: artist.specialties || [],
              rating: artist.rating,
              reviewCount: artist.reviewCount,
              portfolioImages: artist.portfolioImages || [],
              contactInfo: artist.contactInfo || {},
              studioInfo: artist.studioInfo || {},
              studioName: artist.studioInfo?.studioName || "Unknown Studio",
              pricing: artist.pricing || {},
              availability: artist.availability || {},
              experience: artist.experience || {},
              geohash: artist.geohash,
              latitude: artist.latitude,
              longitude: artist.longitude,
              updatedAt: artist.updatedAt,
              createdAt: artist.createdAt,
            }));

            logger.info("DynamoDB fallback search completed successfully", {
              resultCount: artists.length,
              totalHits: dynamoResult.total,
            });

            return createSuccessResponse(artists);
          } catch (dynamoError) {
            logger.error("DynamoDB fallback also failed", {
              error: dynamoError.toString(),
            });
            return createSuccessResponse([]);
          }
        }
      } catch (error) {
        logger.warn("OpenSearch query failed, falling back to DynamoDB", {
          indexName: getIndexName(),
          error: error.message,
        });
        
        // Fall back to DynamoDB
        try {
          const dynamoResult = await searchArtistsInDynamoDB(query, style, location, limit, from);
            artists = dynamoResult.artists.map(artist => ({
              artistId: artist.artistId,
              name: artist.artistName,
              instagramHandle: artist.instagramHandle,
              location: artist.locationDisplay,
              styles: artist.styles || [],
              specialties: artist.specialties || [],
              rating: artist.rating,
              reviewCount: artist.reviewCount,
              portfolioImages: artist.portfolioImages || [],
              contactInfo: artist.contactInfo || {},
              studioInfo: artist.studioInfo || {},
              studioName: artist.studioInfo?.studioName || "Unknown Studio",
              pricing: artist.pricing || {},
              availability: artist.availability || {},
              experience: artist.experience || {},
              geohash: artist.geohash,
              latitude: artist.latitude,
              longitude: artist.longitude,
              updatedAt: artist.updatedAt,
              createdAt: artist.createdAt,
            }));

            logger.info("DynamoDB fallback search completed successfully", {
              resultCount: artists.length,
              totalHits: dynamoResult.total,
            });

            return createSuccessResponse(artists);
          } catch (dynamoError) {
            logger.error("DynamoDB fallback also failed", {
              error: dynamoError.toString(),
            });
            return createSuccessResponse([]);
          }
        }
      }
    } else {
      // Use OpenSearch client for production
      const client = await getOpenSearchClient();

      try {
        const indexExists = await client.indices.exists({
          index: getIndexName(),
        });
        logger.info("Index existence check", {
          indexName: getIndexName(),
          exists: indexExists,
        });

        if (!indexExists.body) {
          logger.warn(
            "OpenSearch index does not exist, falling back to DynamoDB",
            {
              indexName: getIndexName(),
            }
          );
          
          // Fall back to DynamoDB
          try {
            const dynamoResult = await searchArtistsInDynamoDB(query, style, location, limit, from);
            artists = dynamoResult.artists.map(artist => ({
              artistId: artist.artistId,
              name: artist.artistName,
              instagramHandle: artist.instagramHandle,
              location: artist.locationDisplay,
              styles: artist.styles || [],
              specialties: artist.specialties || [],
              rating: artist.rating,
              reviewCount: artist.reviewCount,
              portfolioImages: artist.portfolioImages || [],
              contactInfo: artist.contactInfo || {},
              studioInfo: artist.studioInfo || {},
              studioName: artist.studioInfo?.studioName || "Unknown Studio",
              pricing: artist.pricing || {},
              availability: artist.availability || {},
              experience: artist.experience || {},
              geohash: artist.geohash,
              latitude: artist.latitude,
              longitude: artist.longitude,
              updatedAt: artist.updatedAt,
              createdAt: artist.createdAt,
            }));

            return createSuccessResponse(artists);
          } catch (dynamoError) {
            logger.error("DynamoDB fallback also failed", {
              error: dynamoError.toString(),
            });
            return createSuccessResponse([]);
          }
        }
      } catch (indexError) {
        logger.error("Error checking index existence", {
          error: indexError.toString(),
        });
        
        // Fall back to DynamoDB
        try {
          const dynamoResult = await searchArtistsInDynamoDB(query, style, location, limit, from);
          artists = dynamoResult.artists.map(artist => ({
            artistId: artist.artistId,
            name: artist.artistName,
            instagramHandle: artist.instagramHandle,
            location: artist.locationDisplay,
            styles: artist.styles || [],
            specialties: artist.specialties || [],
            rating: artist.rating,
            reviewCount: artist.reviewCount,
            portfolioImages: artist.portfolioImages || [],
            contactInfo: artist.contactInfo || {},
            studioInfo: artist.studioInfo || {},
            studioName: artist.studioInfo?.studioName || "Unknown Studio",
            pricing: artist.pricing || {},
            availability: artist.availability || {},
            experience: artist.experience || {},
            geohash: artist.geohash,
            latitude: artist.latitude,
            longitude: artist.longitude,
            updatedAt: artist.updatedAt,
            createdAt: artist.createdAt,
          }));

          return createSuccessResponse(artists);
        } catch (dynamoError) {
          logger.error("DynamoDB fallback also failed", {
            error: dynamoError.toString(),
          });
          return createSuccessResponse([]);
        }

        logger.info("About to perform OpenSearch query", { searchParams });
        result = await client.search(searchParams);
      } catch (searchError) {
        logger.error("OpenSearch query failed in production", {
          error: searchError.toString(),
        });
        
        // Fall back to DynamoDB
        try {
          const dynamoResult = await searchArtistsInDynamoDB(query, style, location, limit, from);
          artists = dynamoResult.artists.map(artist => ({
            artistId: artist.artistId,
            name: artist.artistName,
            instagramHandle: artist.instagramHandle,
            location: artist.locationDisplay,
            styles: artist.styles || [],
            specialties: artist.specialties || [],
            rating: artist.rating,
            reviewCount: artist.reviewCount,
            portfolioImages: artist.portfolioImages || [],
            contactInfo: artist.contactInfo || {},
            studioInfo: artist.studioInfo || {},
            studioName: artist.studioInfo?.studioName || "Unknown Studio",
            pricing: artist.pricing || {},
            availability: artist.availability || {},
            experience: artist.experience || {},
            geohash: artist.geohash,
            latitude: artist.latitude,
            longitude: artist.longitude,
            updatedAt: artist.updatedAt,
            createdAt: artist.createdAt,
          }));

          return createSuccessResponse(artists);
        } catch (dynamoError) {
          logger.error("DynamoDB fallback also failed", {
            error: dynamoError.toString(),
          });
          return createSuccessResponse([]);
        }
      }
    }

    logger.info("OpenSearch response received", {
      resultType: typeof result,
      hasBody: !!result.body,
      bodyType: typeof result.body,
      bodyKeys: result.body ? Object.keys(result.body) : "no body",
      resultKeys: result ? Object.keys(result) : "no result",
      fullResult: JSON.stringify(result, null, 2),
    });

    // Only process OpenSearch results if we haven't already processed DynamoDB results
    if (artists.length === 0) {
      // Handle different response structures
      let hits;
      let totalHits = 0;

      if (result.body && result.body.hits && result.body.hits.hits) {
        hits = result.body.hits.hits;
        totalHits = result.body.hits.total?.value || result.body.hits.total || 0;
      } else if (result.hits && result.hits.hits) {
        hits = result.hits.hits;
        totalHits = result.hits.total?.value || result.hits.total || 0;
      } else {
        logger.warn(
          "Unexpected OpenSearch response structure, returning empty results",
          { result }
        );
        return createSuccessResponse([]);
      }

      // Transform the OpenSearch documents to match the expected API format
      artists = hits.map((hit) => {
        const source = hit._source;
        return {
          artistId: source.artistId,
          name: source.artistName, // Use artistName from OpenSearch
          instagramHandle: source.instagramHandle,
          location: source.locationDisplay, // Use locationDisplay from OpenSearch
          styles: source.styles || [],
          specialties: source.specialties || [],
          rating: source.rating,
          reviewCount: source.reviewCount,
          portfolioImages: source.portfolioImages || [],
          contactInfo: source.contactInfo || {},
          studioInfo: source.studioInfo || {},
          studioName: source.studioInfo?.studioName || "Unknown Studio",
          pricing: source.pricing || {},
          availability: source.availability || {},
          experience: source.experience || {},
          geohash: source.geohash,
          latitude: source.latitude,
          longitude: source.longitude,
          updatedAt: source.updatedAt,
          createdAt: source.createdAt,
        };
      });
    }

    logger.info("Artist search completed successfully", {
      resultCount: artists.length,
      totalHits: totalHits,
      hasResults: artists.length > 0,
    });

    return createSuccessResponse(artists);
  } catch (error) {
    logger.error("Error during artist search", {
      error: error.toString(),
      code: error.code,
      stack: error.stack,
    });

    return createErrorResponse(
      500,
      "Internal Server Error",
      "An unexpected error occurred during the search operation.",
      event.requestContext.requestId
    );
  }
}

async function handleGetArtist(event, logger) {
  try {
    const artistId = event.pathParameters?.artistId;

    if (!artistId) {
      logger.warn("Get artist request missing artistId parameter");
      return createErrorResponse(
        400,
        "Bad Request",
        "Artist ID is required in the path.",
        event.requestContext.requestId
      );
    }

    // Try OpenSearch first, fall back to DynamoDB if unavailable
    let useOpenSearch = true;
    try {
      await getOpenSearchClient();
      logger.info("Successfully initialized OpenSearch client");
    } catch (error) {
      logger.warn("OpenSearch client initialization failed, falling back to DynamoDB", {
        error: error.toString(),
        endpoint: process.env.OPENSEARCH_ENDPOINT,
      });
      useOpenSearch = false;
    }

    let result;
    let artist = null;

    if (!useOpenSearch) {
      // Use DynamoDB fallback
      logger.info("Using DynamoDB fallback for get artist", { artistId });

      try {
        const dynamoArtist = await getArtistFromDynamoDB(artistId);
        
        if (!dynamoArtist) {
          logger.info("Artist not found in DynamoDB", { artistId });
          return createErrorResponse(
            404,
            "Not Found",
            `Artist with ID '${artistId}' was not found.`,
            event.requestContext.requestId
          );
        }

        artist = {
          artistId: dynamoArtist.artistId,
          name: dynamoArtist.artistName,
          instagramHandle: dynamoArtist.instagramHandle,
          location: dynamoArtist.locationDisplay,
          styles: dynamoArtist.styles || [],
          specialties: dynamoArtist.specialties || [],
          rating: dynamoArtist.rating,
          reviewCount: dynamoArtist.reviewCount,
          portfolioImages: dynamoArtist.portfolioImages || [],
          contactInfo: dynamoArtist.contactInfo || {},
          studioInfo: dynamoArtist.studioInfo || {},
          studioName: dynamoArtist.studioInfo?.studioName || "Unknown Studio",
          pricing: dynamoArtist.pricing || {},
          availability: dynamoArtist.availability || {},
          experience: dynamoArtist.experience || {},
          geohash: dynamoArtist.geohash,
          latitude: dynamoArtist.latitude,
          longitude: dynamoArtist.longitude,
          updatedAt: dynamoArtist.updatedAt,
          createdAt: dynamoArtist.createdAt,
        };

        logger.info("Artist retrieved successfully from DynamoDB", { artistId });
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(artist),
        };
      } catch (error) {
        logger.error("DynamoDB fallback get artist failed", {
          error: error.toString(),
          artistId,
        });
        return createErrorResponse(
          500,
          "Internal Server Error",
          "An unexpected error occurred while retrieving the artist.",
          event.requestContext.requestId
        );
      }
    }

    if (config.isLocal) {
      // Use HTTP requests for LocalStack
      try {
        logger.info("Fetching individual artist via HTTP for LocalStack", {
          artistId,
        });

        const searchQuery = {
          query: {
            term: { artistId: artistId },
          },
        };

        result = await makeOpenSearchRequest(
          "POST",
          `/${getIndexName()}/_search`,
          searchQuery
        );

        // Wrap result to match OpenSearch client format
        result = {
          body: result,
          hits: result.hits,
        };
      } catch (error) {
        logger.warn("OpenSearch query failed, falling back to DynamoDB", {
          indexName: getIndexName(),
          error: error.message,
        });
          
          // Fall back to DynamoDB
          try {
            const dynamoArtist = await getArtistFromDynamoDB(artistId);
            
            if (!dynamoArtist) {
              return createErrorResponse(
                404,
                "Not Found",
                `Artist with ID '${artistId}' was not found.`,
                event.requestContext.requestId
              );
            }

            artist = {
              artistId: dynamoArtist.artistId,
              name: dynamoArtist.artistName,
              instagramHandle: dynamoArtist.instagramHandle,
              location: dynamoArtist.locationDisplay,
              styles: dynamoArtist.styles || [],
              specialties: dynamoArtist.specialties || [],
              rating: dynamoArtist.rating,
              reviewCount: dynamoArtist.reviewCount,
              portfolioImages: dynamoArtist.portfolioImages || [],
              contactInfo: dynamoArtist.contactInfo || {},
              studioInfo: dynamoArtist.studioInfo || {},
              studioName: dynamoArtist.studioInfo?.studioName || "Unknown Studio",
              pricing: dynamoArtist.pricing || {},
              availability: dynamoArtist.availability || {},
              experience: dynamoArtist.experience || {},
              geohash: dynamoArtist.geohash,
              latitude: dynamoArtist.latitude,
              longitude: dynamoArtist.longitude,
              updatedAt: dynamoArtist.updatedAt,
              createdAt: dynamoArtist.createdAt,
            };

            return {
              statusCode: 200,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(artist),
            };
          } catch (dynamoError) {
            logger.error("DynamoDB fallback also failed", {
              error: dynamoError.toString(),
              artistId,
            });
            return createErrorResponse(
              404,
              "Not Found",
              `Artist with ID '${artistId}' was not found.`,
              event.requestContext.requestId
            );
          }
        }
        throw error;
      }
    } else {
      // Use circuit breaker for production
      const searchParams = {
        index: getIndexName(),
        body: {
          query: {
            term: { artistId: artistId },
          },
        },
      };

      logger.info("Fetching individual artist via circuit breaker", {
        artistId,
      });
      result = await breaker.fire(searchParams);
    }

    if (result.isFallback) {
      logger.warn("Circuit breaker fallback triggered for get artist");
      return {
        statusCode: result.statusCode,
        headers: { "Content-Type": "application/problem+json" },
        body: JSON.stringify(result.body),
      };
    }

    // Handle different response structures
    let hits;
    if (result.body && result.body.hits && result.body.hits.hits) {
      hits = result.body.hits.hits;
    } else if (result.hits && result.hits.hits) {
      hits = result.hits.hits;
    } else {
      logger.warn("Unexpected OpenSearch response structure for get artist", {
        result,
      });
      return createErrorResponse(
        500,
        "Internal Server Error",
        "Unexpected response from search service.",
        event.requestContext.requestId
      );
    }

    if (hits.length === 0) {
      logger.info("Artist not found", { artistId });
      return createErrorResponse(
        404,
        "Not Found",
        `Artist with ID '${artistId}' was not found.`,
        event.requestContext.requestId
      );
    }

    // Transform the artist data to match expected format
    const source = hits[0]._source;
    artist = {
      artistId: source.artistId,
      name: source.artistName, // Use artistName from OpenSearch
      instagramHandle: source.instagramHandle,
      location: source.locationDisplay, // Use locationDisplay from OpenSearch
      styles: source.styles || [],
      specialties: source.specialties || [],
      rating: source.rating,
      reviewCount: source.reviewCount,
      portfolioImages: source.portfolioImages || [],
      contactInfo: source.contactInfo || {},
      studioInfo: source.studioInfo || {},
      studioName: source.studioInfo?.studioName || "Unknown Studio",
      pricing: source.pricing || {},
      availability: source.availability || {},
      experience: source.experience || {},
      geohash: source.geohash,
      latitude: source.latitude,
      longitude: source.longitude,
      updatedAt: source.updatedAt,
      createdAt: source.createdAt,
    };

    logger.info("Artist retrieved successfully", { artistId });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(artist),
    };
  } catch (error) {
    logger.error("Error during get artist", {
      error: error.toString(),
      code: error.code,
      artistId: event.pathParameters?.artistId,
    });

    return createErrorResponse(
      500,
      "Internal Server Error",
      "An unexpected error occurred while retrieving the artist.",
      event.requestContext.requestId
    );
  }
}

async function handleGetStyles(event, logger) {
  try {
    logger.info("Fetching available tattoo styles");

    // Try OpenSearch first, fall back to DynamoDB if unavailable
    let useOpenSearch = true;
    try {
      await getOpenSearchClient();
      logger.info("Successfully initialized OpenSearch client");
    } catch (error) {
      logger.warn("OpenSearch client initialization failed, falling back to DynamoDB", {
        error: error.toString(),
        endpoint: process.env.OPENSEARCH_ENDPOINT,
      });
      useOpenSearch = false;
    }

    let result;
    let styles = [];

    if (!useOpenSearch) {
      // Use DynamoDB fallback
      logger.info("Using DynamoDB fallback for get styles");

      try {
        styles = await getStylesFromDynamoDB();
        logger.info("Styles retrieved successfully from DynamoDB", { styleCount: styles.length });
        return createSuccessResponse(styles);
      } catch (error) {
        logger.error("DynamoDB fallback get styles failed", {
          error: error.toString(),
        });
        return createErrorResponse(
          500,
          "Internal Server Error",
          "An unexpected error occurred while retrieving styles.",
          event.requestContext.requestId
        );
      }
    }

    if (config.isLocal) {
      // Use HTTP requests for LocalStack
      try {
        logger.info("Fetching styles via HTTP for LocalStack");

        const searchQuery = {
          size: 0,
          aggs: {
            unique_styles: {
              terms: {
                field: "styles",
                size: 100,
              },
            },
          },
        };

        result = await makeOpenSearchRequest(
          "POST",
          `/${getIndexName()}/_search`,
          searchQuery
        );

        // Wrap result to match OpenSearch client format
        result = {
          body: result,
          aggregations: result.aggregations,
        };
      } catch (error) {
        logger.warn("OpenSearch query failed, falling back to DynamoDB", {
          indexName: getIndexName(),
          error: error.message,
        });
          
          // Fall back to DynamoDB
          try {
            styles = await getStylesFromDynamoDB();
            return createSuccessResponse(styles);
          } catch (dynamoError) {
            logger.error("DynamoDB fallback also failed", {
              error: dynamoError.toString(),
            });
            return createSuccessResponse([]);
          }
        }
        throw error;
      }
    } else {
      // Use circuit breaker for production
      const searchParams = {
        index: getIndexName(),
        body: {
          size: 0,
          aggs: {
            unique_styles: {
              terms: {
                field: "styles",
                size: 100,
              },
            },
          },
        },
      };

      result = await breaker.fire(searchParams);
    }

    if (result.isFallback) {
      logger.warn("Circuit breaker fallback triggered for get styles");
      return {
        statusCode: result.statusCode,
        headers: { "Content-Type": "application/problem+json" },
        body: JSON.stringify(result.body),
      };
    }

    // Only process OpenSearch results if we haven't already processed DynamoDB results
    if (styles.length === 0) {
      // Handle different response structures
      let buckets = [];
      if (
        result.body &&
        result.body.aggregations &&
        result.body.aggregations.unique_styles
      ) {
        buckets = result.body.aggregations.unique_styles.buckets || [];
      } else if (result.aggregations && result.aggregations.unique_styles) {
        buckets = result.aggregations.unique_styles.buckets || [];
      }

      styles = buckets.map((bucket) => ({
        name: bucket.key,
        count: bucket.doc_count,
      }));
    }

    logger.info("Styles retrieved successfully", { styleCount: styles.length });
    return createSuccessResponse(styles);
  } catch (error) {
    logger.error("Error during get styles", {
      error: error.toString(),
      code: error.code,
    });

    return createErrorResponse(
      500,
      "Internal Server Error",
      "An unexpected error occurred while retrieving styles.",
      event.requestContext.requestId
    );
  }
}

// --- Main Handler ---
export const handler = async (event, context) => {
  const logger = createLogger(context, event);

  logger.info("API Handler invoked", {
    path: event.rawPath,
    method: event.requestContext.http.method,
    correlationId: event.requestContext.requestId,
  });

  // Route handling with v1 prefix support
  const path = event.rawPath;
  const method = event.requestContext.http.method;

  if (path === "/v1/artists" && method === "GET") {
    return handleSearchArtists(event, logger);
  }

  if (path.match(/^\/v1\/artists\/[^\/]+$/) && method === "GET") {
    return handleGetArtist(event, logger);
  }

  if (path === "/v1/styles" && method === "GET") {
    return handleGetStyles(event, logger);
  }

  // Default response for unhandled routes
  logger.warn("Route not found", { path, method });
  return createErrorResponse(
    404,
    "Not Found",
    `Route ${method} ${path} not found.`,
    event.requestContext.requestId
  );
};
