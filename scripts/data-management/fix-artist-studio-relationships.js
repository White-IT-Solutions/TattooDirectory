#!/usr/bin/env node

/**
 * Fix artist-studio relationship inconsistencies
 * Based on studioInfo.studioName matching
 */

const AWS = require("aws-sdk");

async function main() {
  console.log("🔧 Fixing artist-studio relationships based on studio names...\n");

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

    // Create studio name to studio ID mapping
    const studioNameToId = {};
    studios.forEach(studio => {
      if (studio.studioName) {
        studioNameToId[studio.studioName] = studio.studioId;
      }
    });

    console.log("🔗 Studio name mappings:");
    Object.entries(studioNameToId).forEach(([name, id]) => {
      console.log(`   "${name}" → ${id}`);
    });

    // Build artist-to-studio mapping based on studioInfo.studioName
    const studioArtists = {};
    let artistsWithStudios = 0;
    let artistsWithoutStudios = 0;

    console.log("\n📋 Analyzing artist-studio relationships:");
    artists.forEach((artist) => {
      const studioName = artist.studioInfo?.studioName;
      if (studioName && studioNameToId[studioName]) {
        const studioId = studioNameToId[studioName];
        const studioKey = `STUDIO#${studioId}`;
        
        if (!studioArtists[studioKey]) {
          studioArtists[studioKey] = [];
        }
        studioArtists[studioKey].push(artist.artistId);
        artistsWithStudios++;
        
        console.log(`   ✅ ${artist.artistName} → ${studioName} (${studioId})`);
      } else {
        artistsWithoutStudios++;
        console.log(`   ⚠️  ${artist.artistName} → No matching studio (${studioName || 'no studio info'})`);
      }
    });

    console.log(`\n📊 Summary: ${artistsWithStudios} artists with studios, ${artistsWithoutStudios} without`);

    console.log("\n🔄 Updating studio artist lists...");
    let updatedCount = 0;

    for (const studio of studios) {
      const studioKey = studio.PK;
      const expectedArtists = studioArtists[studioKey] || [];
      const currentArtists = studio.artists || [];

      // Check if update is needed
      const needsUpdate =
        expectedArtists.length !== currentArtists.length ||
        !expectedArtists.every((artistId) => currentArtists.includes(artistId));

      if (needsUpdate) {
        console.log(
          `   Updating ${studio.studioName}: ${currentArtists.length} → ${expectedArtists.length} artists`
        );
        console.log(`     Artists: [${expectedArtists.join(', ')}]`);

        await dynamodb
          .update({
            TableName: TABLE_NAME,
            Key: {
              PK: studio.PK,
              SK: studio.SK,
            },
            UpdateExpression: "SET artists = :artists, artistCount = :count, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":artists": expectedArtists,
              ":count": expectedArtists.length,
              ":updatedAt": new Date().toISOString(),
            },
          })
          .promise();

        updatedCount++;
      } else {
        console.log(`   ✅ ${studio.studioName}: Already correct (${expectedArtists.length} artists)`);
      }
    }

    console.log(`\n✅ Fixed relationships for ${updatedCount} studios`);
    console.log("🎉 Relationship fix completed!");
    
  } catch (error) {
    console.error("❌ Failed to fix relationships:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();