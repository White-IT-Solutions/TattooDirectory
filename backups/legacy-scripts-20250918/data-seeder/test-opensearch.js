const http = require("http");

// Test different OpenSearch endpoint formats for LocalStack
const endpoints = [
  "http://localstack:4566",
  "http://localstack:4566/opensearch/tattoo-directory-local",
  "http://localstack:4566/_plugin/opensearch/tattoo-directory-local",
  "http://tattoo-directory-local.eu-west-2.opensearch.localstack:4566",
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    console.log(`Testing endpoint: ${endpoint}`);

    const url = new URL("/", endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port || 4566,
      path: url.pathname,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Response: ${responseData.substring(0, 500)}...`);

        // Try to parse as JSON to see if it's a valid OpenSearch response
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.name || parsed.cluster_name || parsed.version) {
            console.log(`  ✅ Valid OpenSearch response detected!`);
          }
        } catch (e) {
          console.log(`  ❌ Not valid JSON response`);
        }
        resolve({ endpoint, status: res.statusCode, response: responseData });
      });
    });

    req.on("error", (error) => {
      console.log(`  Error: ${error.message}`);
      resolve({ endpoint, error: error.message });
    });

    req.on("timeout", () => {
      console.log(`  Timeout`);
      req.destroy();
      resolve({ endpoint, error: "timeout" });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log("Testing OpenSearch endpoints...\n");

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    console.log("");
  }
}

testAllEndpoints();
