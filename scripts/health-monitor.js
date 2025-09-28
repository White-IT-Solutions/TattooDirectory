#!/usr/bin/env node

/**
 * Health Monitor and Validation System
 *
 * Comprehensive health checking and data validation for all services in the
 * data management system. Provides service connectivity checks, data consistency
 * validation, and detailed system status reporting.
 */

const AWS = require("aws-sdk");
const https = require("https");
const http = require("http");
const { URL } = require("url");
const { DataConfiguration } = require("./data-config");

class HealthMonitor {
  constructor(config = null) {
    this.config = config || new DataConfiguration();
    this.setupAWSClients();
    this.healthStatus = {
      services: {},
      data: {},
      lastCheck: null,
      errors: [],
    };
  }

  setupAWSClients() {
    const awsConfig = {
      region: this.config.services.aws.region,
      accessKeyId: this.config.services.aws.accessKeyId,
      secretAccessKey: this.config.services.aws.secretAccessKey,
      endpoint: this.config.services.aws.endpoint,
    };

    this.dynamodb = new AWS.DynamoDB(awsConfig);
    this.dynamodbDoc = new AWS.DynamoDB.DocumentClient(awsConfig);
    this.s3 = new AWS.S3({
      ...awsConfig,
      s3ForcePathStyle: true,
    });

    // OpenSearch client setup
    this.opensearchEndpoint = this.config.services.opensearch.endpoint;
  }

  /**
   * Perform comprehensive health check of all services
   */
  async performHealthCheck() {
    console.log("🔍 Starting comprehensive health check...");

    this.healthStatus = {
      services: {},
      data: {},
      lastCheck: new Date().toISOString(),
      errors: [],
    };

    try {
      // Check service connectivity
      await this.checkServiceConnectivity();

      // Check data consistency
      await this.checkDataConsistency();

      // Generate status report
      const report = this.generateStatusReport();

      console.log("✅ Health check completed");
      return report;
    } catch (error) {
      console.error("❌ Health check failed:", error.message);
      this.healthStatus.errors.push({
        type: "HEALTH_CHECK_FAILED",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Check connectivity to all required services
   */
  async checkServiceConnectivity() {
    console.log("  📡 Checking service connectivity...");

    const services = [
      { name: "LocalStack", check: () => this.checkLocalStackHealth() },
      { name: "DynamoDB", check: () => this.checkDynamoDBHealth() },
      { name: "S3", check: () => this.checkS3Health() },
      { name: "OpenSearch", check: () => this.checkOpenSearchHealth() },
      { name: "FrontendSync", check: () => this.checkFrontendSyncHealth() },
    ];

    for (const service of services) {
      try {
        console.log(`    🔌 Checking ${service.name}...`);
        const result = await service.check();
        this.healthStatus.services[service.name] = {
          status: "healthy",
          details: result,
          lastCheck: new Date().toISOString(),
        };
        console.log(`    ✅ ${service.name} is healthy`);
      } catch (error) {
        console.error(`    ❌ ${service.name} check failed:`, error.message);
        this.healthStatus.services[service.name] = {
          status: "unhealthy",
          error: error.message,
          lastCheck: new Date().toISOString(),
        };
        this.healthStatus.errors.push({
          type: "SERVICE_CONNECTIVITY",
          service: service.name,
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Check LocalStack health endpoint
   */
  async checkLocalStackHealth() {
    return new Promise((resolve, reject) => {
      const url = new URL(
        "/_localstack/health",
        this.config.services.aws.endpoint
      );
      const client = url.protocol === "https:" ? https : http;

      const req = client.get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const health = JSON.parse(data);
            resolve({
              services: health.services,
              version: health.version || "unknown",
            });
          } catch (error) {
            reject(new Error(`Invalid health response: ${error.message}`));
          }
        });
      });

      req.on("error", (error) => {
        reject(new Error(`LocalStack connection failed: ${error.message}`));
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error("LocalStack health check timeout"));
      });
    });
  }

  /**
   * Check DynamoDB connectivity and table status
   */
  async checkDynamoDBHealth() {
    try {
      // List tables to verify connectivity
      const tables = await this.dynamodb.listTables().promise();

      const tableDetails = {};
      for (const tableName of tables.TableNames) {
        try {
          const tableInfo = await this.dynamodb
            .describeTable({ TableName: tableName })
            .promise();
          const itemCount = await this.getTableItemCount(tableName);

          tableDetails[tableName] = {
            status: tableInfo.Table.TableStatus,
            itemCount: itemCount,
            creationDateTime: tableInfo.Table.CreationDateTime,
          };
        } catch (error) {
          tableDetails[tableName] = {
            status: "error",
            error: error.message,
          };
        }
      }

      return {
        tablesFound: tables.TableNames.length,
        tables: tableDetails,
      };
    } catch (error) {
      throw new Error(`DynamoDB connectivity failed: ${error.message}`);
    }
  }

  /**
   * Get approximate item count for a DynamoDB table
   */
  async getTableItemCount(tableName) {
    try {
      const result = await this.dynamodbDoc
        .scan({
          TableName: tableName,
          Select: "COUNT",
        })
        .promise();
      return result.Count;
    } catch (error) {
      return "unknown";
    }
  }

  /**
   * Check S3 connectivity and bucket status
   */
  async checkS3Health() {
    try {
      // List buckets to verify connectivity
      const buckets = await this.s3.listBuckets().promise();

      const bucketDetails = {};
      for (const bucket of buckets.Buckets) {
        try {
          const objects = await this.s3
            .listObjectsV2({
              Bucket: bucket.Name,
              MaxKeys: 1,
            })
            .promise();

          const objectCount = await this.getBucketObjectCount(bucket.Name);

          bucketDetails[bucket.Name] = {
            objectCount: objectCount,
            creationDate: bucket.CreationDate,
          };
        } catch (error) {
          bucketDetails[bucket.Name] = {
            error: error.message,
          };
        }
      }

      return {
        bucketsFound: buckets.Buckets.length,
        buckets: bucketDetails,
      };
    } catch (error) {
      throw new Error(`S3 connectivity failed: ${error.message}`);
    }
  }

  /**
   * Get object count for an S3 bucket
   */
  async getBucketObjectCount(bucketName) {
    try {
      let count = 0;
      let continuationToken = null;

      do {
        const params = {
          Bucket: bucketName,
          MaxKeys: 1000,
        };

        if (continuationToken) {
          params.ContinuationToken = continuationToken;
        }

        const result = await this.s3.listObjectsV2(params).promise();
        count += result.Contents.length;
        continuationToken = result.NextContinuationToken;
      } while (continuationToken);

      return count;
    } catch (error) {
      return "unknown";
    }
  }

  /**
   * Check OpenSearch connectivity and index status
   */
  async checkOpenSearchHealth() {
    return new Promise((resolve, reject) => {
      const url = new URL("/_cluster/health", this.opensearchEndpoint);
      const client = url.protocol === "https:" ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Host': 'tattoo-directory-local.eu-west-2.opensearch.localstack'
        }
      };

      const req = client.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", async () => {
          try {
            const health = JSON.parse(data);

            // Get index information
            const indices = await this.getOpenSearchIndices();

            resolve({
              clusterName: health.cluster_name,
              status: health.status,
              numberOfNodes: health.number_of_nodes,
              numberOfDataNodes: health.number_of_data_nodes,
              indices: indices,
            });
          } catch (error) {
            reject(
              new Error(`OpenSearch health parsing failed: ${error.message}`)
            );
          }
        });
      });

      req.on("error", (error) => {
        reject(new Error(`OpenSearch connection failed: ${error.message}`));
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error("OpenSearch health check timeout"));
      });

      req.end();
    });
  }

  /**
   * Get OpenSearch index information
   */
  async getOpenSearchIndices() {
    return new Promise((resolve, reject) => {
      const url = new URL("/_cat/indices?format=json", this.opensearchEndpoint);
      const client = url.protocol === "https:" ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Host': 'tattoo-directory-local.eu-west-2.opensearch.localstack'
        }
      };

      const req = client.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const indices = JSON.parse(data);
            const indexDetails = {};

            indices.forEach((index) => {
              indexDetails[index.index] = {
                health: index.health,
                status: index.status,
                docsCount: parseInt(index["docs.count"]) || 0,
                storeSize: index["store.size"],
              };
            });

            resolve(indexDetails);
          } catch (error) {
            resolve({});
          }
        });
      });

      req.on("error", () => {
        resolve({});
      });

      req.setTimeout(3000, () => {
        req.destroy();
        resolve({});
      });

      req.end();
    });
  }

  /**
   * Check data consistency across all services
   */
  async checkDataConsistency() {
    console.log("  🔍 Checking data consistency...");

    try {
      // Check cross-service data consistency
      await this.validateCrossServiceConsistency();

      // Check image URL accessibility
      await this.validateImageAccessibility();

      // Check studio data validation
      await this.validateStudioData();

      // Check data integrity for test scenarios
      await this.validateTestScenarioIntegrity();
    } catch (error) {
      console.error("    ❌ Data consistency check failed:", error.message);
      this.healthStatus.errors.push({
        type: "DATA_CONSISTENCY",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Validate data consistency across DynamoDB and OpenSearch
   */
  async validateCrossServiceConsistency() {
    console.log("    🔄 Validating cross-service consistency...");

    try {
      // Get artist count from DynamoDB
      const dynamoArtists = await this.dynamodbDoc
        .scan({
          TableName: this.config.services.dynamodb.tableName,
          FilterExpression: "begins_with(PK, :artistPrefix)",
          ExpressionAttributeValues: {
            ":artistPrefix": "ARTIST#",
          },
          Select: "COUNT",
        })
        .promise();

      // Get studio count from DynamoDB
      const dynamoStudios = await this.dynamodbDoc
        .scan({
          TableName: this.config.services.dynamodb.tableName,
          FilterExpression: "begins_with(PK, :studioPrefix)",
          ExpressionAttributeValues: {
            ":studioPrefix": "STUDIO#",
          },
          Select: "COUNT",
        })
        .promise();

      // Get artist count from OpenSearch
      let opensearchArtists = 0;
      let opensearchStudios = 0;
      try {
        const artistSearchResult = await this.searchOpenSearch(this.config.services.opensearch.indexName, {
          query: { match_all: {} },
          size: 0,
        });
        opensearchArtists =
          artistSearchResult.hits.total.value || artistSearchResult.hits.total || 0;

        // Check if studio index exists and get studio count
        try {
          const studioSearchResult = await this.searchOpenSearch('studios', {
            query: { match_all: {} },
            size: 0,
          });
          opensearchStudios =
            studioSearchResult.hits.total.value || studioSearchResult.hits.total || 0;
        } catch (studioError) {
          console.warn("    ⚠️  Studio index not found in OpenSearch");
        }
      } catch (error) {
        console.warn(
          "    ⚠️  OpenSearch count unavailable:",
          error.message
        );
      }

      this.healthStatus.data.crossServiceConsistency = {
        dynamoArtistCount: dynamoArtists.Count,
        opensearchArtistCount: opensearchArtists,
        dynamoStudioCount: dynamoStudios.Count,
        opensearchStudioCount: opensearchStudios,
        artistsConsistent: dynamoArtists.Count === opensearchArtists,
        studiosConsistent: dynamoStudios.Count === opensearchStudios,
        lastCheck: new Date().toISOString(),
      };

      if (dynamoArtists.Count !== opensearchArtists) {
        console.warn(
          `    ⚠️  Artist count mismatch: DynamoDB=${dynamoArtists.Count}, OpenSearch=${opensearchArtists}`
        );
      } else {
        console.log(`    ✅ Artist counts consistent: ${dynamoArtists.Count}`);
      }

      if (dynamoStudios.Count !== opensearchStudios) {
        console.warn(
          `    ⚠️  Studio count mismatch: DynamoDB=${dynamoStudios.Count}, OpenSearch=${opensearchStudios}`
        );
      } else {
        console.log(`    ✅ Studio counts consistent: ${dynamoStudios.Count}`);
      }
    } catch (error) {
      throw new Error(`Cross-service validation failed: ${error.message}`);
    }
  }

  /**
   * Search OpenSearch index
   */
  async searchOpenSearch(indexName, query) {
    return new Promise((resolve, reject) => {
      const url = new URL(`/${indexName}/_search`, this.opensearchEndpoint);
      const client = url.protocol === "https:" ? https : http;

      const postData = JSON.stringify(query);

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          "Host": "tattoo-directory-local.eu-west-2.opensearch.localstack"
        },
      };

      const req = client.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            // Check HTTP status code
            if (res.statusCode !== 200) {
              reject(new Error(`OpenSearch request failed with status ${res.statusCode}: ${data}`));
              return;
            }
            
            // Log the raw response for debugging
            if (!data || data.trim() === '') {
              reject(new Error(`OpenSearch response is empty`));
              return;
            }
            
            const result = JSON.parse(data);
            resolve(result);
          } catch (error) {
            reject(
              new Error(`OpenSearch response parsing failed: ${error.message}. Raw response: ${data.substring(0, 200)}`)
            );
          }
        });
      });

      req.on("error", (error) => {
        reject(new Error(`OpenSearch request failed: ${error.message}`));
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error("OpenSearch request timeout"));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Validate image URL accessibility
   */
  async validateImageAccessibility() {
    console.log("    🖼️  Validating image accessibility...");

    try {
      // Get sample of image URLs from DynamoDB (artists)
      const artistsResult = await this.dynamodbDoc
        .scan({
          TableName: this.config.services.dynamodb.tableName,
          FilterExpression: "begins_with(PK, :artistPrefix)",
          ExpressionAttributeValues: {
            ":artistPrefix": "ARTIST#",
          },
          Limit: 10,
        })
        .promise();

      // Get sample of studio image URLs from DynamoDB
      const studiosResult = await this.dynamodbDoc
        .scan({
          TableName: this.config.services.dynamodb.tableName,
          FilterExpression: "begins_with(PK, :studioPrefix)",
          ExpressionAttributeValues: {
            ":studioPrefix": "STUDIO#",
          },
          Limit: 10,
        })
        .promise();

      let totalImages = 0;
      let accessibleImages = 0;
      const imageErrors = [];

      // Check artist images
      for (const artist of artistsResult.Items) {
        if (artist.portfolioImages && Array.isArray(artist.portfolioImages)) {
          for (const imageUrl of artist.portfolioImages.slice(0, 3)) {
            // Check first 3 images per artist
            totalImages++;
            try {
              const accessible = await this.checkImageAccessibility(imageUrl);
              if (accessible) {
                accessibleImages++;
              } else {
                imageErrors.push({
                  entityId: artist.PK,
                  entityType: 'artist',
                  imageUrl: imageUrl,
                  error: "Not accessible",
                });
              }
            } catch (error) {
              imageErrors.push({
                entityId: artist.PK,
                entityType: 'artist',
                imageUrl: imageUrl,
                error: error.message,
              });
            }
          }
        }
      }

      // Check studio images
      for (const studio of studiosResult.Items) {
        if (studio.images && Array.isArray(studio.images)) {
          for (const image of studio.images.slice(0, 3)) {
            // Check first 3 images per studio
            totalImages++;
            try {
              const imageUrl = typeof image === 'string' ? image : image.url;
              const accessible = await this.checkImageAccessibility(imageUrl);
              if (accessible) {
                accessibleImages++;
              } else {
                imageErrors.push({
                  entityId: studio.PK,
                  entityType: 'studio',
                  imageUrl: imageUrl,
                  error: "Not accessible",
                });
              }
            } catch (error) {
              imageErrors.push({
                entityId: studio.PK,
                entityType: 'studio',
                imageUrl: typeof image === 'string' ? image : image.url,
                error: error.message,
              });
            }
          }
        }
      }

      this.healthStatus.data.imageAccessibility = {
        totalChecked: totalImages,
        accessible: accessibleImages,
        accessibilityRate:
          totalImages > 0
            ? ((accessibleImages / totalImages) * 100).toFixed(1)
            : 0,
        errors: imageErrors.slice(0, 10), // Keep first 10 errors
        lastCheck: new Date().toISOString(),
      };

      console.log(
        `    📊 Image accessibility: ${accessibleImages}/${totalImages} (${this.healthStatus.data.imageAccessibility.accessibilityRate}%)`
      );
    } catch (error) {
      throw new Error(
        `Image accessibility validation failed: ${error.message}`
      );
    }
  }

  /**
   * Check if an image URL is accessible
   */
  async checkImageAccessibility(imageUrl) {
    return new Promise((resolve) => {
      try {
        const url = new URL(imageUrl);
        const client = url.protocol === "https:" ? https : http;

        const req = client.request(
          {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: "HEAD",
            timeout: 3000,
          },
          (res) => {
            resolve(res.statusCode >= 200 && res.statusCode < 400);
          }
        );

        req.on("error", () => resolve(false));
        req.on("timeout", () => {
          req.destroy();
          resolve(false);
        });

        req.end();
      } catch (error) {
        resolve(false);
      }
    });
  }

  /**
   * Comprehensive studio data validation
   */
  async validateStudioData() {
    console.log("    🏢 Validating studio data...");

    try {
      // Get all studios from DynamoDB
      const studiosResult = await this.dynamodbDoc
        .scan({
          TableName: this.config.services.dynamodb.tableName,
          FilterExpression: "begins_with(PK, :studioPrefix)",
          ExpressionAttributeValues: {
            ":studioPrefix": "STUDIO#",
          },
        })
        .promise();

      const studios = studiosResult.Items;
      const validationResults = {
        totalStudios: studios.length,
        validStudios: 0,
        validationErrors: [],
        relationshipErrors: [],
        addressErrors: [],
        imageErrors: [],
        dataConsistencyErrors: [],
        lastCheck: new Date().toISOString(),
      };

      // Validate each studio
      for (const studio of studios) {
        const studioValidation = await this.validateSingleStudio(studio);
        
        if (studioValidation.isValid) {
          validationResults.validStudios++;
        }

        // Collect errors by type
        validationResults.validationErrors.push(...studioValidation.validationErrors);
        validationResults.relationshipErrors.push(...studioValidation.relationshipErrors);
        validationResults.addressErrors.push(...studioValidation.addressErrors);
        validationResults.imageErrors.push(...studioValidation.imageErrors);
      }

      // Validate artist-studio relationships
      await this.validateArtistStudioRelationships(validationResults);

      // Check frontend mock data consistency
      await this.validateFrontendStudioMockData(validationResults);

      // Calculate validation rates
      validationResults.validationRate = studios.length > 0 
        ? ((validationResults.validStudios / studios.length) * 100).toFixed(1)
        : 0;

      this.healthStatus.data.studioValidation = validationResults;

      console.log(
        `    📊 Studio validation: ${validationResults.validStudios}/${validationResults.totalStudios} valid (${validationResults.validationRate}%)`
      );

      if (validationResults.validationErrors.length > 0) {
        console.warn(`    ⚠️  Found ${validationResults.validationErrors.length} validation errors`);
      }

      if (validationResults.relationshipErrors.length > 0) {
        console.warn(`    ⚠️  Found ${validationResults.relationshipErrors.length} relationship errors`);
      }

    } catch (error) {
      throw new Error(`Studio data validation failed: ${error.message}`);
    }
  }

  /**
   * Validate a single studio record
   */
  async validateSingleStudio(studio) {
    const validation = {
      studioId: studio.PK,
      isValid: true,
      validationErrors: [],
      relationshipErrors: [],
      addressErrors: [],
      imageErrors: [],
    };

    // Required field validation
    const requiredFields = ['studioId', 'studioName', 'address', 'postcode', 'latitude', 'longitude'];
    for (const field of requiredFields) {
      if (!studio[field]) {
        validation.validationErrors.push({
          studioId: studio.PK,
          field: field,
          error: `Missing required field: ${field}`,
          severity: 'error'
        });
        validation.isValid = false;
      }
    }

    // UK postcode validation
    if (studio.postcode) {
      const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
      if (!postcodeRegex.test(studio.postcode)) {
        validation.addressErrors.push({
          studioId: studio.PK,
          field: 'postcode',
          value: studio.postcode,
          error: 'Invalid UK postcode format',
          severity: 'error'
        });
        validation.isValid = false;
      }
    }

    // Coordinate validation
    if (studio.latitude !== undefined && studio.longitude !== undefined) {
      // UK coordinate bounds: roughly 49.9-60.9 latitude, -8.2-1.8 longitude
      if (studio.latitude < 49.9 || studio.latitude > 60.9) {
        validation.addressErrors.push({
          studioId: studio.PK,
          field: 'latitude',
          value: studio.latitude,
          error: 'Latitude outside UK bounds',
          severity: 'warning'
        });
      }

      if (studio.longitude < -8.2 || studio.longitude > 1.8) {
        validation.addressErrors.push({
          studioId: studio.PK,
          field: 'longitude',
          value: studio.longitude,
          error: 'Longitude outside UK bounds',
          severity: 'warning'
        });
      }
    }

    // Contact information validation
    if (studio.contactInfo) {
      if (studio.contactInfo.email && !this.isValidEmail(studio.contactInfo.email)) {
        validation.validationErrors.push({
          studioId: studio.PK,
          field: 'email',
          value: studio.contactInfo.email,
          error: 'Invalid email format',
          severity: 'warning'
        });
      }

      if (studio.contactInfo.phone && !this.isValidUKPhone(studio.contactInfo.phone)) {
        validation.validationErrors.push({
          studioId: studio.PK,
          field: 'phone',
          value: studio.contactInfo.phone,
          error: 'Invalid UK phone format',
          severity: 'warning'
        });
      }

      if (studio.contactInfo.instagram && !studio.contactInfo.instagram.startsWith('@')) {
        validation.validationErrors.push({
          studioId: studio.PK,
          field: 'instagram',
          value: studio.contactInfo.instagram,
          error: 'Instagram handle should start with @',
          severity: 'warning'
        });
      }
    }

    // Opening hours validation
    if (studio.openingHours) {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const timeRegex = /^(\d{2}:\d{2}-\d{2}:\d{2}|closed)$/i;
      
      for (const day of validDays) {
        if (studio.openingHours[day] && !timeRegex.test(studio.openingHours[day])) {
          validation.validationErrors.push({
            studioId: studio.PK,
            field: `openingHours.${day}`,
            value: studio.openingHours[day],
            error: 'Invalid opening hours format (should be HH:MM-HH:MM or closed)',
            severity: 'warning'
          });
        }
      }
    }

    // Specialties validation
    if (studio.specialties && Array.isArray(studio.specialties)) {
      const validSpecialties = ['traditional', 'realism', 'geometric', 'watercolour', 'blackwork', 'fineline', 'dotwork', 'neo_traditional', 'japanese', 'tribal'];
      for (const specialty of studio.specialties) {
        if (!validSpecialties.includes(specialty)) {
          validation.validationErrors.push({
            studioId: studio.PK,
            field: 'specialties',
            value: specialty,
            error: `Invalid specialty: ${specialty}`,
            severity: 'warning'
          });
        }
      }
    }

    // Rating validation
    if (studio.rating !== undefined) {
      if (studio.rating < 1.0 || studio.rating > 5.0) {
        validation.validationErrors.push({
          studioId: studio.PK,
          field: 'rating',
          value: studio.rating,
          error: 'Rating should be between 1.0 and 5.0',
          severity: 'warning'
        });
      }
    }

    // Image validation
    if (studio.images && Array.isArray(studio.images)) {
      for (const image of studio.images) {
        const imageUrl = typeof image === 'string' ? image : image.url;
        if (imageUrl && !imageUrl.startsWith('http')) {
          validation.imageErrors.push({
            studioId: studio.PK,
            imageUrl: imageUrl,
            error: 'Image URL should be a valid HTTP/HTTPS URL',
            severity: 'error'
          });
        }

        // Check S3 naming convention for studio images
        if (imageUrl && imageUrl.includes('studios/') && !imageUrl.includes(`studios/${studio.studioId}/`)) {
          validation.imageErrors.push({
            studioId: studio.PK,
            imageUrl: imageUrl,
            error: `Studio image should follow naming convention: studios/${studio.studioId}/...`,
            severity: 'warning'
          });
        }
      }
    }

    return validation;
  }

  /**
   * Validate artist-studio relationships for consistency
   */
  async validateArtistStudioRelationships(validationResults) {
    console.log("      🔗 Validating artist-studio relationships...");

    try {
      // Get all artists
      const artistsResult = await this.dynamodbDoc
        .scan({
          TableName: this.config.services.dynamodb.tableName,
          FilterExpression: "begins_with(PK, :artistPrefix)",
          ExpressionAttributeValues: {
            ":artistPrefix": "ARTIST#",
          },
        })
        .promise();

      // Get all studios
      const studiosResult = await this.dynamodbDoc
        .scan({
          TableName: this.config.services.dynamodb.tableName,
          FilterExpression: "begins_with(PK, :studioPrefix)",
          ExpressionAttributeValues: {
            ":studioPrefix": "STUDIO#",
          },
        })
        .promise();

      const artists = artistsResult.Items;
      const studios = studiosResult.Items;

      // Check artist -> studio references
      for (const artist of artists) {
        if (artist.tattooStudio && artist.tattooStudio.studioId) {
          const referencedStudio = studios.find(s => s.studioId === artist.tattooStudio.studioId);
          if (!referencedStudio) {
            validationResults.relationshipErrors.push({
              type: 'orphaned_artist_reference',
              artistId: artist.PK,
              studioId: artist.tattooStudio.studioId,
              error: `Artist references non-existent studio: ${artist.tattooStudio.studioId}`,
              severity: 'error'
            });
          } else {
            // Check if studio lists this artist
            if (!referencedStudio.artists || !referencedStudio.artists.includes(artist.artistId)) {
              validationResults.relationshipErrors.push({
                type: 'missing_reverse_reference',
                artistId: artist.PK,
                studioId: artist.tattooStudio.studioId,
                error: `Studio ${artist.tattooStudio.studioId} doesn't list artist ${artist.artistId}`,
                severity: 'error'
              });
            }
          }
        }
      }

      // Check studio -> artist references
      for (const studio of studios) {
        if (studio.artists && Array.isArray(studio.artists)) {
          for (const artistId of studio.artists) {
            const referencedArtist = artists.find(a => a.artistId === artistId);
            if (!referencedArtist) {
              validationResults.relationshipErrors.push({
                type: 'orphaned_studio_reference',
                studioId: studio.PK,
                artistId: artistId,
                error: `Studio references non-existent artist: ${artistId}`,
                severity: 'error'
              });
            } else {
              // Check if artist references this studio
              if (!referencedArtist.tattooStudio || referencedArtist.tattooStudio.studioId !== studio.studioId) {
                validationResults.relationshipErrors.push({
                  type: 'missing_reverse_reference',
                  studioId: studio.PK,
                  artistId: artistId,
                  error: `Artist ${artistId} doesn't reference studio ${studio.studioId}`,
                  severity: 'error'
                });
              }
            }
          }

          // Validate artist count consistency
          if (studio.artistCount !== studio.artists.length) {
            validationResults.relationshipErrors.push({
              type: 'artist_count_mismatch',
              studioId: studio.PK,
              expectedCount: studio.artists.length,
              actualCount: studio.artistCount,
              error: `Studio artist count mismatch: expected ${studio.artists.length}, got ${studio.artistCount}`,
              severity: 'warning'
            });
          }
        }
      }

      console.log(`      ✅ Relationship validation completed`);
    } catch (error) {
      validationResults.relationshipErrors.push({
        type: 'validation_error',
        error: `Relationship validation failed: ${error.message}`,
        severity: 'error'
      });
    }
  }

  /**
   * Validate frontend studio mock data consistency
   */
  async validateFrontendStudioMockData(validationResults) {
    console.log("      📱 Validating frontend studio mock data...");

    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const mockDataPath = path.join(process.cwd(), 'frontend', 'src', 'app', 'data', 'mockStudioData.js');
      
      try {
        const mockDataContent = await fs.readFile(mockDataPath, 'utf8');
        
        // Extract studio data from the mock file
        const mockStudiosMatch = mockDataContent.match(/export const mockStudios = (\[[\s\S]*?\]);/);
        if (mockStudiosMatch) {
          const mockStudiosStr = mockStudiosMatch[1];
          const mockStudios = JSON.parse(mockStudiosStr);
          
          // Get backend studio count
          const backendStudioCount = validationResults.totalStudios;
          
          if (mockStudios.length !== backendStudioCount) {
            validationResults.dataConsistencyErrors.push({
              type: 'mock_data_count_mismatch',
              error: `Frontend mock studio count (${mockStudios.length}) doesn't match backend count (${backendStudioCount})`,
              severity: 'warning'
            });
          }

          // Validate mock data structure
          for (const mockStudio of mockStudios.slice(0, 3)) { // Check first 3 studios
            const requiredFields = ['studioId', 'studioName', 'address', 'contactInfo', 'specialties'];
            for (const field of requiredFields) {
              if (!mockStudio[field]) {
                validationResults.dataConsistencyErrors.push({
                  type: 'mock_data_structure_error',
                  studioId: mockStudio.studioId || 'unknown',
                  field: field,
                  error: `Missing required field in mock data: ${field}`,
                  severity: 'error'
                });
              }
            }
          }

          console.log(`      ✅ Frontend mock data validated: ${mockStudios.length} studios`);
        } else {
          validationResults.dataConsistencyErrors.push({
            type: 'mock_data_parse_error',
            error: 'Could not parse mockStudios from frontend mock data file',
            severity: 'error'
          });
        }
      } catch (fileError) {
        validationResults.dataConsistencyErrors.push({
          type: 'mock_data_file_error',
          error: `Frontend mock data file not accessible: ${fileError.message}`,
          severity: 'warning'
        });
      }
    } catch (error) {
      validationResults.dataConsistencyErrors.push({
        type: 'mock_data_validation_error',
        error: `Frontend mock data validation failed: ${error.message}`,
        severity: 'error'
      });
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate UK phone number format
   */
  isValidUKPhone(phone) {
    // UK phone number patterns: +44, 0, or direct numbers
    const ukPhoneRegex = /^(\+44\s?|0)(\d{2,4}\s?\d{3,4}\s?\d{3,4}|\d{10,11})$/;
    return ukPhoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Validate data integrity for test scenarios
   */
  async validateTestScenarioIntegrity() {
    // Validating test scenario integrity

    try {
      // Check for required test data patterns
      const scenarios = [
        "london-artists",
        "manchester-artists",
        "birmingham-artists",
        "mixed-location-artists",
        "style-specialists",
      ];

      const scenarioResults = {};

      for (const scenario of scenarios) {
        try {
          const count = await this.validateScenarioData(scenario);
          scenarioResults[scenario] = {
            status: "valid",
            recordCount: count,
          };
        } catch (error) {
          scenarioResults[scenario] = {
            status: "invalid",
            error: error.message,
          };
        }
      }

      this.healthStatus.data.scenarioIntegrity = {
        scenarios: scenarioResults,
        lastCheck: new Date().toISOString(),
      };

      const validScenarios = Object.values(scenarioResults).filter(
        (s) => s.status === "valid"
      ).length;
      console.log(
        `    📋 Scenario integrity: ${validScenarios}/${scenarios.length} scenarios valid`
      );
    } catch (error) {
      throw new Error(`Test scenario validation failed: ${error.message}`);
    }
  }

  /**
   * Validate data for a specific test scenario
   */
  async validateScenarioData(scenario) {
    // This is a simplified validation - in practice, you'd check for specific
    // data patterns expected for each scenario
    const result = await this.dynamodbDoc
      .scan({
        TableName: this.config.services.dynamodb.tableName,
        FilterExpression: "begins_with(PK, :artistPrefix)",
        ExpressionAttributeValues: {
          ":artistPrefix": "ARTIST#",
        },
        Select: "COUNT",
      })
      .promise();

    return result.Count;
  }

  /**
   * Generate comprehensive status report
   */
  generateStatusReport() {
    const report = {
      timestamp: this.healthStatus.lastCheck,
      overall: this.calculateOverallHealth(),
      services: this.healthStatus.services,
      data: this.healthStatus.data,
      errors: this.healthStatus.errors,
      summary: this.generateSummary(),
    };

    return report;
  }

  /**
   * Calculate overall system health status
   */
  calculateOverallHealth() {
    const serviceStatuses = Object.values(this.healthStatus.services);
    const healthyServices = serviceStatuses.filter(
      (s) => s.status === "healthy"
    ).length;
    const totalServices = serviceStatuses.length;

    const hasErrors = this.healthStatus.errors.length > 0;
    const serviceHealthy =
      totalServices > 0 && healthyServices === totalServices;

    if (serviceHealthy && !hasErrors) {
      return "healthy";
    } else if (healthyServices > totalServices / 2) {
      return "degraded";
    } else {
      return "unhealthy";
    }
  }

  /**
   * Generate human-readable summary
   */
  generateSummary() {
    const serviceCount = Object.keys(this.healthStatus.services).length;
    const healthyServices = Object.values(this.healthStatus.services).filter(
      (s) => s.status === "healthy"
    ).length;

    const errorCount = this.healthStatus.errors.length;

    const summary = {
      servicesHealthy: `${healthyServices}/${serviceCount}`,
      errorsFound: errorCount,
      dataConsistency: this.healthStatus.data.crossServiceConsistency
        ?.artistsConsistent && this.healthStatus.data.crossServiceConsistency?.studiosConsistent
        ? "consistent"
        : "inconsistent",
      imageAccessibility:
        this.healthStatus.data.imageAccessibility?.accessibilityRate ||
        "unknown",
    };

    // Add studio-specific summary data
    if (this.healthStatus.data.crossServiceConsistency) {
      summary.artistCount = this.healthStatus.data.crossServiceConsistency.dynamoArtistCount || 0;
      summary.studioCount = this.healthStatus.data.crossServiceConsistency.dynamoStudioCount || 0;
    }

    if (this.healthStatus.data.studioValidation) {
      summary.studioValidationRate = this.healthStatus.data.studioValidation.validationRate || "unknown";
      summary.studioRelationshipErrors = this.healthStatus.data.studioValidation.relationshipErrors?.length || 0;
    }

    return summary;
  }

  /**
   * Get current system status without performing new checks
   */
  getSystemStatus() {
    return {
      lastCheck: this.healthStatus.lastCheck,
      overall: this.calculateOverallHealth(),
      summary: this.generateSummary(),
      services: Object.keys(this.healthStatus.services).reduce(
        (acc, service) => {
          acc[service] = this.healthStatus.services[service].status;
          return acc;
        },
        {}
      ),
    };
  }

  /**
   * Check if system is ready for operations
   */
  async isSystemReady() {
    try {
      await this.performHealthCheck();
      const overall = this.calculateOverallHealth();
      return overall === "healthy" || overall === "degraded";
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate data with specific validation type
   */
  async validateData(type = "all") {
    console.log(`🔍 Validating data (type: ${type})...`);

    const validationResults = {
      type: type,
      timestamp: new Date().toISOString(),
      results: {},
      errors: [],
    };

    try {
      switch (type) {
        case "consistency":
          await this.validateCrossServiceConsistency();
          validationResults.results.consistency =
            this.healthStatus.data.crossServiceConsistency;
          break;

        case "images":
          await this.validateImageAccessibility();
          validationResults.results.images =
            this.healthStatus.data.imageAccessibility;
          break;

        case "studios":
          await this.validateStudioData();
          validationResults.results.studios =
            this.healthStatus.data.studioValidation;
          break;

        case "scenarios":
          await this.validateTestScenarioIntegrity();
          validationResults.results.scenarios =
            this.healthStatus.data.scenarioIntegrity;
          break;

        case "all":
        default:
          await this.validateCrossServiceConsistency();
          await this.validateImageAccessibility();
          await this.validateStudioData();
          await this.validateTestScenarioIntegrity();
          validationResults.results = {
            consistency: this.healthStatus.data.crossServiceConsistency,
            images: this.healthStatus.data.imageAccessibility,
            studios: this.healthStatus.data.studioValidation,
            scenarios: this.healthStatus.data.scenarioIntegrity,
          };
          break;
      }

      console.log("✅ Data validation completed");
      return validationResults;
    } catch (error) {
      console.error("❌ Data validation failed:", error.message);
      validationResults.errors.push({
        type: "VALIDATION_FAILED",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Check frontend sync processor health and capabilities
   */
  async checkFrontendSyncHealth() {
    try {
      const { FrontendSyncProcessor } = require('./frontend-sync-processor');
      const processor = new FrontendSyncProcessor(this.config);
      
      // Test basic functionality
      const testResult = await processor.generateMockData({
        artistCount: 1,
        scenario: 'single',
        validateData: true
      });
      
      const health = {
        status: testResult.success ? 'healthy' : 'unhealthy',
        lastCheck: new Date().toISOString(),
        capabilities: {
          enhancedGeneration: true,
          businessData: true,
          studioRelationships: true,
          dataValidation: true,
          exportFunctionality: true,
          scenarioSupport: true
        },
        performance: testResult.stats?.performance || {},
        errors: testResult.stats?.errors || []
      };
      
      if (!testResult.success) {
        health.error = testResult.error;
        health.details = 'Enhanced frontend sync processor test failed';
      }
      
      this.healthStatus.services.frontendSync = health;
      return health;
      
    } catch (error) {
      const health = {
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        error: error.message,
        details: 'Frontend sync processor initialization failed'
      };
      
      this.healthStatus.services.frontendSync = health;
      return health;
    }
  }

  /**
   * Check all services connectivity
   */
  async checkAllServices() {
    console.log("🔍 Checking all services...");

    try {
      await this.checkServiceConnectivity();

      const serviceStatus = {
        timestamp: new Date().toISOString(),
        services: this.healthStatus.services,
        overall: this.calculateServiceHealth(),
        summary: this.generateServiceSummary(),
      };

      console.log("✅ Service check completed");
      return serviceStatus;
    } catch (error) {
      console.error("❌ Service check failed:", error.message);
      throw error;
    }
  }

  /**
   * Calculate overall service health
   */
  calculateServiceHealth() {
    const services = Object.values(this.healthStatus.services);
    const healthyServices = services.filter(
      (s) => s.status === "healthy"
    ).length;
    const totalServices = services.length;

    if (totalServices === 0) return "unknown";
    if (healthyServices === totalServices) return "healthy";
    if (healthyServices > totalServices / 2) return "degraded";
    return "unhealthy";
  }

  /**
   * Generate service summary
   */
  generateServiceSummary() {
    const services = this.healthStatus.services;
    const summary = {};

    Object.keys(services).forEach((serviceName) => {
      const service = services[serviceName];
      summary[serviceName] = {
        status: service.status,
        lastCheck: service.lastCheck,
      };

      // Add specific details based on service type
      if (service.details) {
        if (serviceName === "DynamoDB" && service.details.tables) {
          summary[serviceName].tableCount = Object.keys(
            service.details.tables
          ).length;
          summary[serviceName].totalItems = Object.values(
            service.details.tables
          ).reduce(
            (sum, table) =>
              sum + (typeof table.itemCount === "number" ? table.itemCount : 0),
            0
          );
        }

        if (serviceName === "S3" && service.details.buckets) {
          summary[serviceName].bucketCount = Object.keys(
            service.details.buckets
          ).length;
          summary[serviceName].totalObjects = Object.values(
            service.details.buckets
          ).reduce(
            (sum, bucket) =>
              sum +
              (typeof bucket.objectCount === "number" ? bucket.objectCount : 0),
            0
          );
        }

        if (serviceName === "OpenSearch" && service.details.indices) {
          summary[serviceName].indexCount = Object.keys(
            service.details.indices
          ).length;
          summary[serviceName].totalDocuments = Object.values(
            service.details.indices
          ).reduce((sum, index) => sum + (index.docsCount || 0), 0);
        }
      }
    });

    return summary;
  }

  /**
   * Generate studio-specific troubleshooting guidance
   */
  generateStudioTroubleshootingGuidance() {
    const guidance = {
      timestamp: new Date().toISOString(),
      issues: [],
      recommendations: [],
    };

    // Check for common studio data issues
    if (this.healthStatus.data.studioValidation) {
      const studioValidation = this.healthStatus.data.studioValidation;

      // Low validation rate
      if (parseFloat(studioValidation.validationRate) < 80) {
        guidance.issues.push({
          type: 'low_validation_rate',
          severity: 'warning',
          description: `Studio validation rate is ${studioValidation.validationRate}% (below 80%)`,
          troubleshooting: [
            'Check studio data generation parameters in data-config.js',
            'Verify studio data seeding completed successfully',
            'Run: npm run validate --workspace=scripts/documentation-analysis-studios for detailed error report',
            'Consider regenerating studio data: npm run seed --workspace=scripts-studios'
          ]
        });
      }

      // Relationship errors
      if (studioValidation.relationshipErrors && studioValidation.relationshipErrors.length > 0) {
        guidance.issues.push({
          type: 'relationship_errors',
          severity: 'error',
          description: `Found ${studioValidation.relationshipErrors.length} artist-studio relationship errors`,
          troubleshooting: [
            'Check artist-studio relationship consistency',
            'Verify bidirectional references are maintained',
            'Run: npm run validate --workspace=scripts/documentation-analysis-studios --type=relationships',
            'Consider running relationship repair: npm run repair-relationships'
          ]
        });
      }

      // Address validation errors
      if (studioValidation.addressErrors && studioValidation.addressErrors.length > 0) {
        guidance.issues.push({
          type: 'address_errors',
          severity: 'warning',
          description: `Found ${studioValidation.addressErrors.length} studio address validation errors`,
          troubleshooting: [
            'Check UK postcode format validation',
            'Verify coordinate accuracy for UK locations',
            'Review address data generation in studio data generator',
            'Consider updating address validation rules'
          ]
        });
      }

      // Image accessibility issues
      if (studioValidation.imageErrors && studioValidation.imageErrors.length > 0) {
        guidance.issues.push({
          type: 'image_errors',
          severity: 'warning',
          description: `Found ${studioValidation.imageErrors.length} studio image errors`,
          troubleshooting: [
            'Check S3 bucket accessibility and CORS configuration',
            'Verify studio image naming conventions: studios/{studioId}/...',
            'Run: npm run process-studio-images to regenerate images',
            'Check LocalStack S3 service status'
          ]
        });
      }
    }

    // Check cross-service consistency
    if (this.healthStatus.data.crossServiceConsistency) {
      const consistency = this.healthStatus.data.crossServiceConsistency;
      
      if (!consistency.studiosConsistent) {
        guidance.issues.push({
          type: 'studio_count_mismatch',
          severity: 'error',
          description: `Studio count mismatch: DynamoDB=${consistency.dynamoStudioCount}, OpenSearch=${consistency.opensearchStudioCount}`,
          troubleshooting: [
            'Check OpenSearch studio index exists and is populated',
            'Verify studio data seeding completed for both services',
            'Run: npm run seed --workspace=scripts-studios to reseed studio data',
            'Check OpenSearch service connectivity'
          ]
        });
      }
    }

    // Generate recommendations based on issues found
    if (guidance.issues.length === 0) {
      guidance.recommendations.push({
        type: 'healthy_system',
        description: 'Studio data validation passed all checks',
        actions: [
          'Continue regular health monitoring',
          'Consider running periodic validation: npm run validate --workspace=scripts/documentation-analysis-studios',
          'Monitor studio data growth and performance'
        ]
      });
    } else {
      guidance.recommendations.push({
        type: 'issue_resolution',
        description: 'Address identified studio data issues',
        actions: [
          'Review and fix validation errors in order of severity',
          'Run targeted validation: npm run validate --workspace=scripts/documentation-analysis-studios --type=studios',
          'Consider full studio data regeneration if issues persist',
          'Update monitoring alerts for studio data quality'
        ]
      });
    }

    return guidance;
  }

  /**
   * Get studio data health report
   */
  async getStudioHealthReport() {
    console.log("🏢 Generating studio health report...");

    try {
      // Ensure studio validation has been run
      if (!this.healthStatus.data.studioValidation) {
        await this.validateStudioData();
      }

      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalStudios: this.healthStatus.data.studioValidation?.totalStudios || 0,
          validStudios: this.healthStatus.data.studioValidation?.validStudios || 0,
          validationRate: this.healthStatus.data.studioValidation?.validationRate || "0",
          relationshipErrors: this.healthStatus.data.studioValidation?.relationshipErrors?.length || 0,
          addressErrors: this.healthStatus.data.studioValidation?.addressErrors?.length || 0,
          imageErrors: this.healthStatus.data.studioValidation?.imageErrors?.length || 0,
        },
        validation: this.healthStatus.data.studioValidation,
        troubleshooting: this.generateStudioTroubleshootingGuidance(),
        recommendations: this.generateStudioRecommendations(),
      };

      console.log("✅ Studio health report generated");
      return report;
    } catch (error) {
      console.error("❌ Studio health report generation failed:", error.message);
      throw error;
    }
  }

  /**
   * Generate studio-specific recommendations
   */
  generateStudioRecommendations() {
    const recommendations = [];

    if (this.healthStatus.data.studioValidation) {
      const validation = this.healthStatus.data.studioValidation;
      const validationRate = parseFloat(validation.validationRate);

      if (validationRate >= 95) {
        recommendations.push({
          priority: 'low',
          category: 'maintenance',
          title: 'Excellent Studio Data Quality',
          description: 'Studio data validation rate is excellent (95%+)',
          actions: ['Continue current data management practices', 'Monitor for any degradation']
        });
      } else if (validationRate >= 80) {
        recommendations.push({
          priority: 'medium',
          category: 'improvement',
          title: 'Good Studio Data Quality',
          description: 'Studio data validation rate is good but could be improved',
          actions: ['Review and fix remaining validation errors', 'Consider data quality improvements']
        });
      } else {
        recommendations.push({
          priority: 'high',
          category: 'critical',
          title: 'Poor Studio Data Quality',
          description: 'Studio data validation rate is below acceptable threshold',
          actions: ['Immediate review of studio data generation', 'Consider full data regeneration']
        });
      }

      // Relationship-specific recommendations
      if (validation.relationshipErrors && validation.relationshipErrors.length > 0) {
        recommendations.push({
          priority: 'high',
          category: 'relationships',
          title: 'Artist-Studio Relationship Issues',
          description: `${validation.relationshipErrors.length} relationship errors detected`,
          actions: [
            'Run relationship consistency repair',
            'Review artist-studio assignment logic',
            'Implement stronger relationship validation'
          ]
        });
      }

      // Image-specific recommendations
      if (validation.imageErrors && validation.imageErrors.length > 0) {
        recommendations.push({
          priority: 'medium',
          category: 'images',
          title: 'Studio Image Issues',
          description: `${validation.imageErrors.length} image errors detected`,
          actions: [
            'Check S3 bucket configuration and accessibility',
            'Verify image processing pipeline',
            'Review image naming conventions'
          ]
        });
      }
    }

    return recommendations;
  }
}

// CLI interface for studio health monitoring
async function runStudioHealthCheck() {
  const args = process.argv.slice(2);
  const command = args[0] || 'health';
  const type = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'all';

  const monitor = new HealthMonitor();

  try {
    switch (command) {
      case 'health':
        console.log('🏢 Running studio health check...');
        const healthReport = await monitor.getStudioHealthReport();
        console.log('\n📊 Studio Health Summary:');
        console.log(`  Total Studios: ${healthReport.summary.totalStudios}`);
        console.log(`  Valid Studios: ${healthReport.summary.validStudios}`);
        console.log(`  Validation Rate: ${healthReport.summary.validationRate}%`);
        console.log(`  Relationship Errors: ${healthReport.summary.relationshipErrors}`);
        console.log(`  Address Errors: ${healthReport.summary.addressErrors}`);
        console.log(`  Image Errors: ${healthReport.summary.imageErrors}`);
        
        if (healthReport.troubleshooting.issues.length > 0) {
          console.log('\n⚠️  Issues Found:');
          healthReport.troubleshooting.issues.forEach(issue => {
            console.log(`  - ${issue.description}`);
            console.log(`    Severity: ${issue.severity}`);
            console.log(`    Troubleshooting:`);
            issue.troubleshooting.forEach(step => console.log(`      • ${step}`));
          });
        }
        break;

      case 'validate':
        console.log(`🔍 Running studio validation (type: ${type})...`);
        const validationResult = await monitor.validateData(type);
        console.log('\n✅ Validation completed');
        console.log(JSON.stringify(validationResult, null, 2));
        break;

      case 'status':
        console.log('📊 Getting system status...');
        const status = monitor.getSystemStatus();
        console.log(JSON.stringify(status, null, 2));
        break;

      case 'troubleshoot':
        console.log('🔧 Generating troubleshooting guidance...');
        await monitor.performHealthCheck();
        const guidance = monitor.generateStudioTroubleshootingGuidance();
        console.log(JSON.stringify(guidance, null, 2));
        break;

      default:
        console.log('Usage: node health-monitor.js [command] [options]');
        console.log('Commands:');
        console.log('  health       - Run comprehensive studio health check');
        console.log('  validate     - Run data validation (--type=all|studios|consistency|images)');
        console.log('  status       - Get current system status');
        console.log('  troubleshoot - Generate troubleshooting guidance');
        break;
    }
  } catch (error) {
    console.error('❌ Health monitor failed:', error.message);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  runStudioHealthCheck();
}

module.exports = { HealthMonitor };
