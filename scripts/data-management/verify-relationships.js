#!/usr/bin/env node

/**
 * Verify artist-studio relationships and show summary statistics
 */

const AWS = require("aws-sdk");

async function main() {
  console.log("🔍 Verifying artist-studio relationships...\n");

  const config = require("../data-config");
  console.log("✅ Config loaded successfully");

  AWS.config.update({
    region: config.services.aws.region,
    endpoint: config.services.aws.endpoint,
    accessKeyId: config.services.aws.accessKeyId,
    secretAccessKey: config.services.aws.secretAccessKey,
    s3ForcePathStyle: true,
  });

  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const TABLE_NAME = config.services.dynamodb.tableName;

  try {
    // Get all artists
    console.log("📊 Scanning artists...");
    const artistsResult = await dynamodb
      .scan({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(PK, :artistPrefix)",
        ExpressionAttributeValues: {
          ":artistPrefix": "ARTIST#",
        },
      })
      .promise();

    const artists = artistsResult.Items;
    console.log(`   Found ${artists.length} artists`);

    // Get all studios
    console.log("🏢 Scanning studios...");
    const studiosResult = await dynamodb
      .scan({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(PK, :studioPrefix)",
        ExpressionAttributeValues: {
          ":studioPrefix": "STUDIO#",
        },
      })
      .promise();

    const studios = studiosResult.Items;
    console.log(`   Found ${studios.length} studios\n`);

    // Analyze relationships
    const studioStats = {};
    let artistsWithStudios = 0;
    let artistsWithoutStudios = 0;

    artists.forEach(artist => {
      if (artist.studioInfo?.studioName) {
        artistsWithStudios++;
        const studioName = artist.studioInfo.studioName;
        if (!studioStats[studioName]) {
          studioStats[studioName] = {
            count: 0,
            artists: []
          };
        }
        studioStats[studioName].count++;
        studioStats[studioName].artists.push(artist.artistName);
      } else {
        artistsWithoutStudios++;
      }
    });

    console.log("📈 Relationship Statistics:");
    console.log(`   ✅ Artists with studios: ${artistsWithStudios}`);
    console.log(`   ⚠️  Artists without studios: ${artistsWithoutStudios}`);
    console.log(`   🏢 Studios with artists: ${Object.keys(studioStats).length}`);
    console.log(`   📊 Average artists per studio: ${Math.round(artistsWithStudios / Object.keys(studioStats).length)}`);

    console.log("\n🏢 Studio Distribution:");
    Object.entries(studioStats)
      .sort(([,a], [,b]) => b.count - a.count)
      .forEach(([studioName, stats]) => {
        console.log(`   ${studioName}: ${stats.count} artists`);
      });

    // Verify studio records have correct artist counts
    console.log("\n🔍 Verifying studio records:");
    let correctStudios = 0;
    let incorrectStudios = 0;

    for (const studio of studios) {
      const expectedCount = studioStats[studio.studioName]?.count || 0;
      const actualCount = studio.artistCount || 0;
      
      if (expectedCount === actualCount) {
        correctStudios++;
        console.log(`   ✅ ${studio.studioName}: ${actualCount} artists (correct)`);
      } else {
        incorrectStudios++;
        console.log(`   ❌ ${studio.studioName}: Expected ${expectedCount}, got ${actualCount}`);
      }
    }

    console.log(`\n📊 Studio Record Verification:`);
    console.log(`   ✅ Correct studio records: ${correctStudios}`);
    console.log(`   ❌ Incorrect studio records: ${incorrectStudios}`);

    if (incorrectStudios === 0 && artistsWithoutStudios === 0) {
      console.log("\n🎉 All relationships are correctly established!");
    } else {
      console.log("\n⚠️  Some issues found - consider running fix script");
    }
    
  } catch (error) {
    console.error("❌ Failed to verify relationships:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();