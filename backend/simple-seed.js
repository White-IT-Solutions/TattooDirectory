#!/usr/bin/env node

/**
 * Simple seeding script using the working HTTP approach
 */

import http from "http";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function makeOpenSearchRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localstack",
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

async function createIndex() {
  console.log("🔍 Creating OpenSearch index...");

  // Delete index if it exists
  try {
    await makeOpenSearchRequest("DELETE", "/artists-local");
    console.log("✅ Deleted existing index");
  } catch (error) {
    console.log("ℹ️  No existing index to delete");
  }

  // Create new index
  const indexMapping = {
    mappings: {
      properties: {
        artistId: { type: "keyword" },
        artistName: {
          type: "text",
          fields: { keyword: { type: "keyword" } },
        },
        instagramHandle: { type: "keyword" },
        locationDisplay: {
          type: "text",
          fields: { keyword: { type: "keyword" } },
        },
        styles: { type: "keyword" },
        specialties: { type: "keyword" },
        geohash: { type: "keyword" },
        latitude: { type: "float" },
        longitude: { type: "float" },
        rating: { type: "float" },
        reviewCount: { type: "integer" },
        portfolioImages: {
          type: "nested",
          properties: {
            url: { type: "keyword" },
            description: { type: "text" },
            style: { type: "keyword" },
            tags: { type: "keyword" },
          },
        },
        contactInfo: {
          properties: {
            instagram: { type: "keyword" },
            website: { type: "keyword" },
            email: { type: "keyword" },
            phone: { type: "keyword" },
          },
        },
        studioInfo: {
          properties: {
            studioName: {
              type: "text",
              fields: { keyword: { type: "keyword" } },
            },
            address: { type: "text" },
            postcode: { type: "keyword" },
          },
        },
        pricing: {
          properties: {
            hourlyRate: { type: "integer" },
            minimumCharge: { type: "integer" },
            currency: { type: "keyword" },
          },
        },
        availability: {
          properties: {
            bookingOpen: { type: "boolean" },
            nextAvailable: { type: "date" },
            waitingList: { type: "boolean" },
          },
        },
        experience: {
          properties: {
            yearsActive: { type: "integer" },
            apprenticeshipCompleted: { type: "boolean" },
            certifications: { type: "keyword" },
          },
        },
      },
    },
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
    },
  };

  await makeOpenSearchRequest("PUT", "/artists-local", indexMapping);
  console.log("✅ Created OpenSearch index");
}

async function loadArtistData() {
  const artistsPath = join(__dirname, "../scripts/test-data/artists.json");
  const data = await readFile(artistsPath, "utf-8");
  return JSON.parse(data);
}

async function indexArtists() {
  console.log("🎨 Loading and indexing artists...");

  const artists = await loadArtistData();
  console.log(`📊 Loaded ${artists.length} artists`);

  for (const artist of artists) {
    const document = {
      artistId: artist.artistId,
      artistName: artist.artistName,
      instagramHandle: artist.instagramHandle,
      locationDisplay: artist.locationDisplay,
      styles: artist.styles,
      specialties: artist.specialties || [],
      geohash: artist.geohash,
      latitude: artist.latitude,
      longitude: artist.longitude,
      rating: artist.rating,
      reviewCount: artist.reviewCount,
      portfolioImages: artist.portfolioImages || [],
      contactInfo: artist.contactInfo,
      studioInfo: artist.studioInfo,
      pricing: artist.pricing,
      availability: artist.availability,
      experience: artist.experience,
      location: {
        lat: artist.latitude,
        lon: artist.longitude,
      },
    };

    await makeOpenSearchRequest(
      "PUT",
      `/artists-local/_doc/${artist.artistId}`,
      document
    );
    console.log(`✅ Indexed: ${artist.artistName}`);
  }

  // Refresh index
  await makeOpenSearchRequest("POST", "/artists-local/_refresh");
  console.log("✅ Index refreshed");

  return artists.length;
}

async function verifyData() {
  console.log("🔍 Verifying indexed data...");

  const countResponse = await makeOpenSearchRequest(
    "GET",
    "/artists-local/_count"
  );
  console.log(`📊 Index contains ${countResponse.count} documents`);

  const searchResponse = await makeOpenSearchRequest(
    "POST",
    "/artists-local/_search",
    {
      query: { match_all: {} },
      size: 3,
    }
  );

  console.log(`🎨 Sample artists:`);
  searchResponse.hits.hits.forEach((hit, index) => {
    const artist = hit._source;
    console.log(
      `  ${index + 1}. ${artist.artistName} - ${artist.locationDisplay}`
    );
  });

  return countResponse.count;
}

async function main() {
  try {
    console.log("🌱 Starting simple OpenSearch seeding...");

    await createIndex();
    const indexedCount = await indexArtists();
    const verifiedCount = await verifyData();

    console.log(`\n✅ Seeding completed successfully!`);
    console.log(`📊 Indexed: ${indexedCount} artists`);
    console.log(`🔍 Verified: ${verifiedCount} documents`);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

main();
