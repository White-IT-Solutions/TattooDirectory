#!/usr/bin/env node

/**
 * Reassign artists to existing studios to create proper relationships
 * This will update artist records to use existing studio names
 */

const AWS = require("aws-sdk");

async function main() {
  console.log("🔄 Reassigning artists to existing studios...\n");

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

    // Create list of available studios
    const availableStudios = studios.map(studio => ({
      studioId: studio.studioId,
      studioName: studio.studioName,
      location: studio.location,
      postcode: studio.postcode,
      city: studio.city
    }));

    console.log("🎯 Available studios:");
    availableStudios.forEach(studio => {
      console.log(`   ${studio.studioName} (${studio.studioId}) - ${studio.city}`);
    });

    // Shuffle function for random distribution
    function shuffleArray(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    // Distribute artists evenly across studios
    const shuffledStudios = shuffleArray(availableStudios);
    const artistsPerStudio = Math.ceil(artists.length / studios.length);
    
    console.log(`\n📋 Distributing ${artists.length} artists across ${studios.length} studios (~${artistsPerStudio} per studio)`);

    let updatedCount = 0;
    const studioAssignments = {};

    for (let i = 0; i < artists.length; i++) {
      const artist = artists[i];
      const studioIndex = i % shuffledStudios.length;
      const assignedStudio = shuffledStudios[studioIndex];

      // Track assignments for studio updates
      if (!studioAssignments[assignedStudio.studioId]) {
        studioAssignments[assignedStudio.studioId] = [];
      }
      studioAssignments[assignedStudio.studioId].push(artist.artistId);

      // Update artist with new studio info
      const updateParams = {
        TableName: TABLE_NAME,
        Key: {
          PK: artist.PK,
          SK: artist.SK,
        },
        UpdateExpression: "SET studioInfo = :studioInfo, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":studioInfo": {
            studioId: assignedStudio.studioId,
            studioName: assignedStudio.studioName,
            location: assignedStudio.location,
            postcode: assignedStudio.postcode,
            city: assignedStudio.city
          },
          ":updatedAt": new Date().toISOString(),
        },
      };

      await dynamodb.update(updateParams).promise();
      updatedCount++;

      console.log(`   ✅ ${artist.artistName} → ${assignedStudio.studioName} (${assignedStudio.city})`);
    }

    console.log(`\n🔄 Updating studio artist lists...`);
    let studioUpdatedCount = 0;

    for (const studio of studios) {
      const assignedArtists = studioAssignments[studio.studioId] || [];
      
      const updateParams = {
        TableName: TABLE_NAME,
        Key: {
          PK: studio.PK,
          SK: studio.SK,
        },
        UpdateExpression: "SET artists = :artists, artistCount = :count, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":artists": assignedArtists,
          ":count": assignedArtists.length,
          ":updatedAt": new Date().toISOString(),
        },
      };

      await dynamodb.update(updateParams).promise();
      studioUpdatedCount++;

      console.log(`   ✅ ${studio.studioName}: ${assignedArtists.length} artists assigned`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated ${updatedCount} artists`);
    console.log(`   ✅ Updated ${studioUpdatedCount} studios`);
    console.log(`   🎯 Average ${Math.round(artists.length / studios.length)} artists per studio`);
    
    console.log("\n🎉 Artist reassignment completed!");
    
  } catch (error) {
    console.error("❌ Failed to reassign artists:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();