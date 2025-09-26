#!/usr/bin/env node

const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const http = require("http");

// Configure AWS SDK for LocalStack
const isRunningInContainer =
  process.env.DOCKER_CONTAINER === "true" || fs.existsSync("/.dockerenv");
const defaultEndpoint = isRunningInContainer
  ? "http://localstack:4566"
  : "http://localhost:4566";

AWS.config.update({
  region: process.env.AWS_DEFAULT_REGION || "eu-west-2",
  endpoint: process.env.AWS_ENDPOINT_URL || defaultEndpoint,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
  s3ForcePathStyle: true,
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "tattoo-directory-local";
const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || "artists-local";

class TestUtilities {
  constructor() {
    this.testResults = [];
    this.stats = {
      passed: 0,
      failed: 0,
      skipped: 0,
    };
  }

  makeOpenSearchRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const hostname = isRunningInContainer ? "localstack" : "localhost";
      const options = {
        hostname: hostname,
        port: 4566,
        path: path,
        method: method,
        headers: {
          "Content-Type": "application/json",
          Host: "tattoo-directory-local.eu-west-2.opensearch.localstack",
        },
      };

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

  // Test assertion helpers
  assert(condition, message) {
    if (condition) {
      this.testResults.push({ status: "PASS", message });
      this.stats.passed++;
      console.log(`✅ ${message}`);
    } else {
      this.testResults.push({ status: "FAIL", message });
      this.stats.failed++;
      console.log(`❌ ${message}`);
    }
  }

  assertEqual(actual, expected, message) {
    const condition = JSON.stringify(actual) === JSON.stringify(expected);
    this.assert(
      condition,
      `${message} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(
        actual
      )})`
    );
  }

  assertGreaterThan(actual, expected, message) {
    this.assert(actual > expected, `${message} (${actual} > ${expected})`);
  }

  assertLessThan(actual, expected, message) {
    this.assert(actual < expected, `${message} (${actual} < ${expected})`);
  }

  assertContains(array, item, message) {
    this.assert(
      array.includes(item),
      `${message} (array should contain ${item})`
    );
  }

  assertNotNull(value, message) {
    this.assert(
      value !== null && value !== undefined,
      `${message} (value should not be null/undefined)`
    );
  }

  // Service availability tests
  async testDynamoDBConnection() {
    console.log("🔍 Testing DynamoDB connection...");
    try {
      await dynamodb.describeTable({ TableName: TABLE_NAME }).promise();
      this.assert(true, "DynamoDB connection successful");
      return true;
    } catch (error) {
      this.assert(false, `DynamoDB connection failed: ${error.message}`);
      return false;
    }
  }

  async testOpenSearchConnection() {
    console.log("🔍 Testing OpenSearch connection...");
    try {
      await this.makeOpenSearchRequest("GET", "/_cluster/health");
      this.assert(true, "OpenSearch connection successful");
      return true;
    } catch (error) {
      this.assert(false, `OpenSearch connection failed: ${error.message}`);
      return false;
    }
  }

  // Data integrity tests
  async testTableExists() {
    console.log("🔍 Testing table existence...");
    try {
      const result = await dynamodb
        .describeTable({ TableName: TABLE_NAME })
        .promise();
      this.assert(
        result.Table.TableStatus === "ACTIVE",
        "DynamoDB table is active"
      );
      return true;
    } catch (error) {
      this.assert(false, `Table check failed: ${error.message}`);
      return false;
    }
  }

  async testIndexExists() {
    console.log("🔍 Testing OpenSearch index...");
    try {
      await this.makeOpenSearchRequest("GET", `/${OPENSEARCH_INDEX}`);
      this.assert(true, "OpenSearch index exists");
      return true;
    } catch (error) {
      this.assert(false, `Index check failed: ${error.message}`);
      return false;
    }
  }

  async testDataCount() {
    console.log("🔍 Testing data counts...");

    try {
      // Count DynamoDB items
      const dynamoResult = await dynamodb
        .scan({
          TableName: TABLE_NAME,
          Select: "COUNT",
        })
        .promise();

      this.assertGreaterThan(dynamoResult.Count, 0, "DynamoDB has data");

      // Count OpenSearch documents
      const osResult = await this.makeOpenSearchRequest(
        "GET",
        `/${OPENSEARCH_INDEX}/_count`
      );
      this.assertGreaterThan(osResult.count, 0, "OpenSearch has documents");

      return { dynamo: dynamoResult.Count, opensearch: osResult.count };
    } catch (error) {
      this.assert(false, `Data count test failed: ${error.message}`);
      return null;
    }
  }

  // Search functionality tests
  async testBasicSearch() {
    console.log("🔍 Testing basic search functionality...");

    try {
      const searchQuery = {
        query: {
          match_all: {},
        },
        size: 5,
      };

      const result = await this.makeOpenSearchRequest(
        "GET",
        `/${OPENSEARCH_INDEX}/_search`,
        searchQuery
      );

      this.assertNotNull(result.hits, "Search returned hits");
      this.assertGreaterThan(
        result.hits.total.value,
        0,
        "Search found results"
      );

      return result.hits.hits;
    } catch (error) {
      this.assert(false, `Basic search test failed: ${error.message}`);
      return null;
    }
  }

  async testLocationSearch() {
    console.log("🔍 Testing location-based search...");

    try {
      const searchQuery = {
        query: {
          match: {
            locationDisplay: "London",
          },
        },
      };

      const result = await this.makeOpenSearchRequest(
        "GET",
        `/${OPENSEARCH_INDEX}/_search`,
        searchQuery
      );

      this.assertNotNull(result.hits, "Location search returned hits");

      if (result.hits.hits.length > 0) {
        const firstHit = result.hits.hits[0]._source;
        this.assertContains(
          firstHit.locationDisplay.toLowerCase(),
          "london",
          "Result contains London"
        );
      }

      return result.hits.hits;
    } catch (error) {
      this.assert(false, `Location search test failed: ${error.message}`);
      return null;
    }
  }

  async testStyleSearch() {
    console.log("🔍 Testing style-based search...");

    try {
      const searchQuery = {
        query: {
          terms: {
            styles: ["traditional", "realism"],
          },
        },
      };

      const result = await this.makeOpenSearchRequest(
        "GET",
        `/${OPENSEARCH_INDEX}/_search`,
        searchQuery
      );

      this.assertNotNull(result.hits, "Style search returned hits");

      if (result.hits.hits.length > 0) {
        const firstHit = result.hits.hits[0]._source;
        this.assertNotNull(firstHit.styles, "Result has styles");
      }

      return result.hits.hits;
    } catch (error) {
      this.assert(false, `Style search test failed: ${error.message}`);
      return null;
    }
  }

  // Data consistency tests
  async testDataConsistency() {
    console.log("🔍 Testing data consistency...");

    try {
      // Get sample artist from DynamoDB
      const dynamoResult = await dynamodb
        .scan({
          TableName: TABLE_NAME,
          FilterExpression: "begins_with(PK, :pk)",
          ExpressionAttributeValues: { ":pk": "ARTIST#" },
          Limit: 1,
        })
        .promise();

      if (dynamoResult.Items.length === 0) {
        this.assert(false, "No artists found in DynamoDB");
        return false;
      }

      const artist = dynamoResult.Items[0];
      const artistId = artist.artistId;

      // Check if same artist exists in OpenSearch
      const osResult = await this.makeOpenSearchRequest(
        "GET",
        `/${OPENSEARCH_INDEX}/_doc/${artistId}`
      );

      this.assertNotNull(osResult._source, "Artist exists in OpenSearch");
      this.assertEqual(
        osResult._source.artistName,
        artist.artistName,
        "Artist names match"
      );

      return true;
    } catch (error) {
      this.assert(false, `Data consistency test failed: ${error.message}`);
      return false;
    }
  }

  // Performance tests
  async testSearchPerformance() {
    console.log("🔍 Testing search performance...");

    const startTime = Date.now();

    try {
      const searchQuery = {
        query: { match_all: {} },
        size: 10,
      };

      await this.makeOpenSearchRequest(
        "GET",
        `/${OPENSEARCH_INDEX}/_search`,
        searchQuery
      );

      const duration = Date.now() - startTime;
      this.assertLessThan(
        duration,
        1000,
        `Search completed in ${duration}ms (under 1s)`
      );

      return duration;
    } catch (error) {
      this.assert(false, `Search performance test failed: ${error.message}`);
      return null;
    }
  }

  async testDynamoPerformance() {
    console.log("🔍 Testing DynamoDB performance...");

    const startTime = Date.now();

    try {
      await dynamodb
        .scan({
          TableName: TABLE_NAME,
          Limit: 10,
        })
        .promise();

      const duration = Date.now() - startTime;
      this.assertLessThan(
        duration,
        500,
        `DynamoDB scan completed in ${duration}ms (under 500ms)`
      );

      return duration;
    } catch (error) {
      this.assert(false, `DynamoDB performance test failed: ${error.message}`);
      return null;
    }
  }

  // Utility functions for test data
  generateTestArtist(id = "test-artist-001") {
    return {
      artistId: id,
      artistName: `Test Artist ${id.split("-").pop()}`,
      instagramHandle: `test_artist_${id.split("-").pop()}`,
      styles: ["traditional", "realism"],
      locationDisplay: "London, UK",
      geohash: "gcpvj0",
      latitude: 51.5074,
      longitude: -0.1278,
      rating: 4.5,
      reviewCount: 25,
      portfolioImages: [
        { url: "https://example.com/image1.jpg", caption: "Test image 1" },
        { url: "https://example.com/image2.jpg", caption: "Test image 2" },
      ],
      availability: {
        bookingOpen: true,
        nextAvailable: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        waitingList: false,
      },
      experience: {
        yearsActive: 5,
        apprenticeshipCompleted: true,
      },
      pricing: {
        currency: "GBP",
        hourlyRate: 120,
        minimumCharge: 150,
      },
    };
  }

  generateTestStudio(id = "test-studio-001") {
    return {
      studioId: id,
      studioName: `Test Studio ${id.split("-").pop()}`,
      address: "123 Test Street, London",
      postcode: "SW1A 1AA",
      geohash: "gcpvj0",
      latitude: 51.5074,
      longitude: -0.1278,
      specialties: ["traditional", "realism", "blackwork"],
    };
  }

  generateTestStyle(id = "test-style") {
    return {
      styleId: id,
      styleName: "Test Style",
      description: "A test tattoo style for validation purposes",
      difficulty: "intermediate",
      popularity: 75,
    };
  }

  // Cleanup utilities
  async cleanupTestData() {
    console.log("🧹 Cleaning up test data...");

    try {
      // Remove test items from DynamoDB
      const testItems = await dynamodb
        .scan({
          TableName: TABLE_NAME,
          FilterExpression: "contains(PK, :test)",
          ExpressionAttributeValues: { ":test": "test-" },
        })
        .promise();

      for (const item of testItems.Items) {
        await dynamodb
          .delete({
            TableName: TABLE_NAME,
            Key: { PK: item.PK, SK: item.SK },
          })
          .promise();
      }

      // Remove test documents from OpenSearch
      const searchResult = await this.makeOpenSearchRequest(
        "GET",
        `/${OPENSEARCH_INDEX}/_search`,
        {
          query: {
            wildcard: {
              artistId: "test-*",
            },
          },
        }
      );

      for (const hit of searchResult.hits.hits) {
        await this.makeOpenSearchRequest(
          "DELETE",
          `/${OPENSEARCH_INDEX}/_doc/${hit._id}`
        );
      }

      this.assert(true, "Test data cleanup completed");
    } catch (error) {
      this.assert(false, `Cleanup failed: ${error.message}`);
    }
  }

  // Test suite runners
  async runConnectivityTests() {
    console.log("\n🔗 Running Connectivity Tests...");
    await this.testDynamoDBConnection();
    await this.testOpenSearchConnection();
    await this.testTableExists();
    await this.testIndexExists();
  }

  async runDataTests() {
    console.log("\n📊 Running Data Tests...");
    await this.testDataCount();
    await this.testDataConsistency();
  }

  async runSearchTests() {
    console.log("\n🔍 Running Search Tests...");
    await this.testBasicSearch();
    await this.testLocationSearch();
    await this.testStyleSearch();
  }

  async runPerformanceTests() {
    console.log("\n⚡ Running Performance Tests...");
    await this.testSearchPerformance();
    await this.testDynamoPerformance();
  }

  async runAllTests() {
    console.log("🧪 Running All Tests...\n");

    await this.runConnectivityTests();
    await this.runDataTests();
    await this.runSearchTests();
    await this.runPerformanceTests();

    this.printTestSummary();
  }

  printTestSummary() {
    console.log("\n📋 Test Summary:");
    console.log("┌─────────────┬─────────┐");
    console.log("│ Status      │ Count   │");
    console.log("├─────────────┼─────────┤");
    console.log(
      `│ Passed      │ ${this.stats.passed.toString().padStart(7)} │`
    );
    console.log(
      `│ Failed      │ ${this.stats.failed.toString().padStart(7)} │`
    );
    console.log(
      `│ Skipped     │ ${this.stats.skipped.toString().padStart(7)} │`
    );
    console.log("└─────────────┴─────────┘");

    const total = this.stats.passed + this.stats.failed + this.stats.skipped;
    const successRate =
      total > 0 ? ((this.stats.passed / total) * 100).toFixed(1) : 0;

    console.log(`\n📊 Success Rate: ${successRate}%`);

    if (this.stats.failed > 0) {
      console.log("\n❌ Failed Tests:");
      this.testResults
        .filter((result) => result.status === "FAIL")
        .forEach((result) => console.log(`  • ${result.message}`));
    }
  }

  // Export test results
  saveTestResults(filename = "test-results.json") {
    const results = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      results: this.testResults,
    };

    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`📄 Test results saved to: ${filename}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const testUtils = new TestUtilities();

  try {
    switch (command) {
      case "connectivity":
        await testUtils.runConnectivityTests();
        break;

      case "data":
        await testUtils.runDataTests();
        break;

      case "search":
        await testUtils.runSearchTests();
        break;

      case "performance":
        await testUtils.runPerformanceTests();
        break;

      case "all":
        await testUtils.runAllTests();
        break;

      case "cleanup":
        await testUtils.cleanupTestData();
        break;

      default:
        console.log("🧪 Test Utilities Usage:");
        console.log(
          "  node test-utilities.js connectivity  - Test service connections"
        );
        console.log(
          "  node test-utilities.js data          - Test data integrity"
        );
        console.log(
          "  node test-utilities.js search        - Test search functionality"
        );
        console.log(
          "  node test-utilities.js performance   - Test performance metrics"
        );
        console.log("  node test-utilities.js all           - Run all tests");
        console.log(
          "  node test-utilities.js cleanup       - Clean up test data"
        );
        process.exit(1);
    }

    testUtils.printTestSummary();

    // Save results if requested
    if (args.includes("--save")) {
      testUtils.saveTestResults();
    }

    process.exit(testUtils.stats.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("❌ Test execution failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TestUtilities;
