#!/usr/bin/env node

/**
 * Mock Data Generation Utilities
 *
 * Provides utilities for generating realistic mock data for development and testing:
 * - Artist profiles with realistic data
 * - Search results with various scenarios
 * - Error responses in RFC 9457 format
 * - Performance testing data
 */

const fs = require("fs").promises;
const path = require("path");

class MockDataGenerator {
  constructor() {
    this.artistNames = [
      "Sarah Mitchell",
      "Jake Thompson",
      "Luna Rodriguez",
      "Marcus Chen",
      "Isabella Foster",
      "Ethan Brooks",
      "Maya Patel",
      "Connor Walsh",
      "Zoe Anderson",
      "Dylan Martinez",
      "Aria Kim",
      "Logan Davis",
      "Nova Johnson",
      "Phoenix Taylor",
      "River Stone",
      "Sage Williams",
    ];

    this.studioNames = [
      "Ink & Steel",
      "Sacred Art Tattoo",
      "Black Rose Studio",
      "Iron Wolf Tattoo",
      "Crimson Needle",
      "Electric Lotus",
      "Midnight Canvas",
      "Golden Anchor",
      "Rebel Heart Tattoo",
      "Mystic Ink",
      "Urban Legend",
      "Wild Spirit Tattoo",
      "Neon Dreams",
      "Classic Lines",
      "Modern Primitive",
      "Artisan Ink",
    ];

    this.tattooStyles = [
      "traditional",
      "neo-traditional",
      "realism",
      "blackwork",
      "geometric",
      "watercolor",
      "minimalist",
      "japanese",
      "tribal",
      "biomechanical",
      "portrait",
      "abstract",
      "dotwork",
      "linework",
      "surrealism",
    ];

    this.locations = [
      { city: "London", postcode: "E1 6AN", geohash: "gcpvj0" },
      { city: "Manchester", postcode: "M1 1AA", geohash: "gcw2j0" },
      { city: "Birmingham", postcode: "B1 1AA", geohash: "gcqd50" },
      { city: "Leeds", postcode: "LS1 1AA", geohash: "gcxe60" },
      { city: "Glasgow", postcode: "G1 1AA", geohash: "gcyej0" },
      { city: "Liverpool", postcode: "L1 1AA", geohash: "gcw0j0" },
      { city: "Bristol", postcode: "BS1 1AA", geohash: "gcnp30" },
      { city: "Edinburgh", postcode: "EH1 1AA", geohash: "gcvwr0" },
    ];

    this.portfolioDescriptions = [
      "Traditional rose with thorns",
      "Realistic portrait piece",
      "Geometric mandala design",
      "Japanese dragon sleeve",
      "Minimalist line art",
      "Watercolor butterfly",
      "Blackwork tribal pattern",
      "Neo-traditional skull",
      "Abstract geometric shapes",
      "Dotwork mountain landscape",
      "Biomechanical arm piece",
      "Surreal eye design",
    ];
  }

  /**
   * Generate a random artist profile
   */
  generateArtist(options = {}) {
    const artistId = options.artistId || `artist-${this.randomId()}`;
    const name = options.name || this.randomChoice(this.artistNames);
    const location = options.location || this.randomChoice(this.locations);
    const styles =
      options.styles || this.randomChoices(this.tattooStyles, 2, 4);
    const studioName =
      options.studioName || this.randomChoice(this.studioNames);

    const instagramHandle = name.toLowerCase().replace(/\s+/g, "") + "tattoo";
    const website = `https://${name
      .toLowerCase()
      .replace(/\s+/g, "")}.tattoo.com`;
    const email = `${name.toLowerCase().replace(/\s+/g, ".")}@${studioName
      .toLowerCase()
      .replace(/\s+/g, "")}.com`;

    return {
      artistId,
      artistName: name,
      instagramHandle,
      geohash: location.geohash,
      locationDisplay: `${location.city}, UK`,
      postcode: location.postcode,
      studioName,
      styles,
      portfolioImages: this.generatePortfolioImages(styles),
      contactInfo: {
        instagram: `@${instagramHandle}`,
        website,
        email,
        phone: this.generatePhoneNumber(),
      },
      rating: this.randomFloat(4.0, 5.0, 1),
      reviewCount: this.randomInt(10, 150),
      yearsExperience: this.randomInt(2, 20),
      priceRange: this.randomChoice(["£", "££", "£££"]),
      availability: this.randomChoice([
        "Available",
        "Booking 2-3 weeks",
        "Booking 1-2 months",
        "Waitlist only",
      ]),
      specialties: this.randomChoices(
        [
          "Custom designs",
          "Cover-ups",
          "Large pieces",
          "Fine line work",
          "Color work",
          "Black and grey",
          "Walk-ins welcome",
        ],
        1,
        3
      ),
      createdAt: this.randomPastDate(365).toISOString(),
      updatedAt: this.randomPastDate(30).toISOString(),
    };
  }

  /**
   * Generate portfolio images for an artist
   */
  generatePortfolioImages(styles, count = null) {
    const imageCount = count || this.randomInt(5, 12);
    const images = [];

    for (let i = 0; i < imageCount; i++) {
      const style = this.randomChoice(styles);
      const description = this.randomChoice(this.portfolioDescriptions);

      images.push({
        imageId: `img-${this.randomId()}`,
        url: `https://example.com/portfolio/${this.randomId()}.jpg`,
        thumbnailUrl: `https://example.com/portfolio/thumb/${this.randomId()}.jpg`,
        description: `${description} - ${style} style`,
        style,
        tags: this.randomChoices(
          ["healed", "fresh", "color", "black-and-grey", "large", "small"],
          1,
          3
        ),
        uploadedAt: this.randomPastDate(180).toISOString(),
      });
    }

    return images;
  }

  /**
   * Generate a list of artists
   */
  generateArtists(count = 20) {
    const artists = [];
    const usedNames = new Set();

    for (let i = 0; i < count; i++) {
      let name;
      do {
        name = this.randomChoice(this.artistNames);
      } while (usedNames.has(name) && usedNames.size < this.artistNames.length);

      usedNames.add(name);

      artists.push(
        this.generateArtist({
          artistId: `artist-${String(i + 1).padStart(3, "0")}`,
          name,
        })
      );
    }

    return artists;
  }

  /**
   * Generate search results with various scenarios
   */
  generateSearchResults(query = {}) {
    const {
      style = null,
      location = null,
      limit = 10,
      scenario = "normal",
    } = query;

    let artists = this.generateArtists(50);

    // Filter by style if specified
    if (style) {
      artists = artists.filter((artist) =>
        artist.styles.some((s) => s.toLowerCase().includes(style.toLowerCase()))
      );
    }

    // Filter by location if specified
    if (location) {
      artists = artists.filter((artist) =>
        artist.locationDisplay.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Apply scenario modifications
    switch (scenario) {
      case "empty":
        artists = [];
        break;
      case "single":
        artists = artists.slice(0, 1);
        break;
      case "many":
        artists = this.generateArtists(100);
        break;
      case "slow":
        // Simulate slow response (handled by caller)
        break;
    }

    // Limit results
    artists = artists.slice(0, limit);

    return {
      artists,
      totalCount: artists.length,
      query: {
        style,
        location,
        limit,
      },
      metadata: {
        searchTime: this.randomInt(50, 300),
        scenario,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate error responses in RFC 9457 format
   */
  generateErrorResponse(type = "validation", options = {}) {
    const errors = {
      validation: {
        type: "https://tattoo-directory.com/errors/validation-error",
        title: "Validation Error",
        status: 400,
        detail: "The request contains invalid parameters",
        instance: "/v1/artists/search",
        errors: [
          {
            field: "style",
            code: "invalid_value",
            message:
              "Style must be one of: traditional, neo-traditional, realism, blackwork, geometric",
          },
        ],
      },
      not_found: {
        type: "https://tattoo-directory.com/errors/not-found",
        title: "Artist Not Found",
        status: 404,
        detail: "The requested artist could not be found",
        instance: `/v1/artists/${options.artistId || "artist-999"}`,
      },
      rate_limit: {
        type: "https://tattoo-directory.com/errors/rate-limit",
        title: "Rate Limit Exceeded",
        status: 429,
        detail: "Too many requests. Please try again later.",
        instance: options.instance || "/v1/artists/search",
        "retry-after": 60,
      },
      server_error: {
        type: "https://tattoo-directory.com/errors/internal-error",
        title: "Internal Server Error",
        status: 500,
        detail: "An unexpected error occurred while processing your request",
        instance: options.instance || "/v1/artists",
      },
      service_unavailable: {
        type: "https://tattoo-directory.com/errors/service-unavailable",
        title: "Service Unavailable",
        status: 503,
        detail: "The search service is temporarily unavailable",
        instance: "/v1/artists/search",
        "retry-after": 30,
      },
    };

    const error = errors[type] || errors.server_error;

    return {
      ...error,
      timestamp: new Date().toISOString(),
      requestId: this.randomId(),
      ...options,
    };
  }

  /**
   * Generate performance testing data
   */
  generatePerformanceTestData(options = {}) {
    const {
      artistCount = 1000,
      searchQueries = 50,
      includeImages = true,
    } = options;

    const data = {
      artists: this.generateArtists(artistCount),
      searchQueries: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        artistCount,
        searchQueries: searchQueries,
        includeImages,
        estimatedSize: `${Math.round(artistCount * 2.5)}KB`,
      },
    };

    // Generate search queries for testing
    for (let i = 0; i < searchQueries; i++) {
      data.searchQueries.push({
        queryId: `query-${i + 1}`,
        style: this.randomChoice([null, ...this.tattooStyles]),
        location: this.randomChoice([
          null,
          ...this.locations.map((l) => l.city),
        ]),
        limit: this.randomChoice([5, 10, 20, 50]),
        expectedResults: this.randomInt(0, 20),
      });
    }

    return data;
  }

  /**
   * Save generated data to files
   */
  async saveToFile(data, filename) {
    const filePath = path.join(process.cwd(), "scripts/test-data", filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved ${filename} (${JSON.stringify(data).length} bytes)`);
    return filePath;
  }

  /**
   * Generate complete test dataset
   */
  async generateTestDataset(options = {}) {
    const {
      artistCount = 50,
      saveFiles = true,
      outputDir = "scripts/test-data",
    } = options;

    console.log("🎭 Generating mock test dataset...");

    const dataset = {
      artists: this.generateArtists(artistCount),
      searchScenarios: {
        normal: this.generateSearchResults({ limit: 10 }),
        empty: this.generateSearchResults({ scenario: "empty" }),
        single: this.generateSearchResults({ scenario: "single" }),
        styleFilter: this.generateSearchResults({
          style: "traditional",
          limit: 5,
        }),
        locationFilter: this.generateSearchResults({
          location: "London",
          limit: 8,
        }),
      },
      errorScenarios: {
        validation: this.generateErrorResponse("validation"),
        notFound: this.generateErrorResponse("not_found", {
          artistId: "artist-999",
        }),
        rateLimit: this.generateErrorResponse("rate_limit"),
        serverError: this.generateErrorResponse("server_error"),
        serviceUnavailable: this.generateErrorResponse("service_unavailable"),
      },
      performanceData: this.generatePerformanceTestData({ artistCount: 100 }),
      metadata: {
        generatedAt: new Date().toISOString(),
        version: "1.0.0",
        artistCount,
        totalSize: 0,
      },
    };

    // Calculate total size
    dataset.metadata.totalSize = JSON.stringify(dataset).length;

    if (saveFiles) {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Save individual files
      await this.saveToFile(dataset.artists, "mock-artists.json");
      await this.saveToFile(
        dataset.searchScenarios,
        "mock-search-scenarios.json"
      );
      await this.saveToFile(
        dataset.errorScenarios,
        "mock-error-scenarios.json"
      );
      await this.saveToFile(
        dataset.performanceData,
        "mock-performance-data.json"
      );

      // Save complete dataset
      await this.saveToFile(dataset, "mock-complete-dataset.json");
    }

    console.log(`✅ Generated dataset with ${artistCount} artists`);
    console.log(
      `📊 Total size: ${Math.round(dataset.metadata.totalSize / 1024)}KB`
    );

    return dataset;
  }

  // Utility methods
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  randomChoices(array, min, max) {
    const count = this.randomInt(min, max);
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomFloat(min, max, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  randomId() {
    return Math.random().toString(36).substring(2, 15);
  }

  randomPastDate(maxDaysAgo) {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * maxDaysAgo);
    return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  }

  generatePhoneNumber() {
    const formats = [
      "+44 20 7946 0958",
      "+44 161 496 0123",
      "+44 121 496 0456",
      "+44 113 496 0789",
    ];
    return this.randomChoice(formats);
  }
}

// CLI interface
if (require.main === module) {
  const generator = new MockDataGenerator();

  const command = process.argv[2];
  const options = {};

  // Parse command line options
  for (let i = 3; i < process.argv.length; i += 2) {
    const key = process.argv[i]?.replace("--", "");
    const value = process.argv[i + 1];
    if (key && value) {
      options[key] = isNaN(value) ? value : parseInt(value);
    }
  }

  switch (command) {
    case "artists":
      const count = options.count || 20;
      const artists = generator.generateArtists(count);
      console.log(JSON.stringify(artists, null, 2));
      break;

    case "search":
      const searchResults = generator.generateSearchResults(options);
      console.log(JSON.stringify(searchResults, null, 2));
      break;

    case "error":
      const errorType = options.type || "validation";
      const error = generator.generateErrorResponse(errorType, options);
      console.log(JSON.stringify(error, null, 2));
      break;

    case "dataset":
      generator
        .generateTestDataset(options)
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("❌ Error generating dataset:", error.message);
          process.exit(1);
        });
      break;

    default:
      console.log(`
Mock Data Generator for Tattoo Directory

Usage: node devtools/scripts/mock-data-generator.js <command> [options]

Commands:
  artists     Generate artist profiles
  search      Generate search results
  error       Generate error responses
  dataset     Generate complete test dataset

Options:
  --count <n>        Number of items to generate
  --type <type>      Error type (validation, not_found, rate_limit, server_error, service_unavailable)
  --style <style>    Filter by tattoo style
  --location <loc>   Filter by location
  --scenario <name>  Search scenario (normal, empty, single, many, slow)
  --artistCount <n>  Number of artists in dataset
  --saveFiles        Save to files (default: true)

Examples:
  node devtools/scripts/mock-data-generator.js artists --count 10
  node devtools/scripts/mock-data-generator.js search --style traditional --limit 5
  node devtools/scripts/mock-data-generator.js error --type not_found
  node devtools/scripts/mock-data-generator.js dataset --artistCount 100
`);
      break;
  }
}

module.exports = MockDataGenerator;
