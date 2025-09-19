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

      // Get artist count from OpenSearch
      let opensearchArtists = 0;
      try {
        const searchResult = await this.searchOpenSearch(this.config.services.opensearch.indexName, {
          query: { match_all: {} },
          size: 0,
        });
        opensearchArtists =
          searchResult.hits.total.value || searchResult.hits.total || 0;
      } catch (error) {
        console.warn(
          "    ⚠️  OpenSearch artist count unavailable:",
          error.message
        );
      }

      this.healthStatus.data.crossServiceConsistency = {
        dynamoArtistCount: dynamoArtists.Count,
        opensearchArtistCount: opensearchArtists,
        consistent: dynamoArtists.Count === opensearchArtists,
        lastCheck: new Date().toISOString(),
      };

      if (dynamoArtists.Count !== opensearchArtists) {
        console.warn(
          `    ⚠️  Artist count mismatch: DynamoDB=${dynamoArtists.Count}, OpenSearch=${opensearchArtists}`
        );
      } else {
        console.log(`    ✅ Artist counts consistent: ${dynamoArtists.Count}`);
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
      // Get sample of image URLs from DynamoDB
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

      let totalImages = 0;
      let accessibleImages = 0;
      const imageErrors = [];

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
                  artistId: artist.PK,
                  imageUrl: imageUrl,
                  error: "Not accessible",
                });
              }
            } catch (error) {
              imageErrors.push({
                artistId: artist.PK,
                imageUrl: imageUrl,
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
        errors: imageErrors.slice(0, 5), // Keep only first 5 errors
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

    return {
      servicesHealthy: `${healthyServices}/${serviceCount}`,
      errorsFound: errorCount,
      dataConsistency: this.healthStatus.data.crossServiceConsistency
        ?.consistent
        ? "consistent"
        : "inconsistent",
      imageAccessibility:
        this.healthStatus.data.imageAccessibility?.accessibilityRate ||
        "unknown",
    };
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

        case "scenarios":
          await this.validateTestScenarioIntegrity();
          validationResults.results.scenarios =
            this.healthStatus.data.scenarioIntegrity;
          break;

        case "all":
        default:
          await this.validateCrossServiceConsistency();
          await this.validateImageAccessibility();
          await this.validateTestScenarioIntegrity();
          validationResults.results = {
            consistency: this.healthStatus.data.crossServiceConsistency,
            images: this.healthStatus.data.imageAccessibility,
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
}

module.exports = { HealthMonitor };
