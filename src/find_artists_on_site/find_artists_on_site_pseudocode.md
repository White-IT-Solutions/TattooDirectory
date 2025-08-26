// Filename: find_artists_on_site_index.js

// --- Dependencies ---
// IMPORT an HTTP client like 'axios' to fetch the website's HTML.
// IMPORT a lightweight HTML parsing library like 'cheerio' to navigate the DOM.
// IMPORT the shared, PII-scrubbing logger from '../common/logger'.

// --- Main Handler ---
// This function receives a SINGLE studio object from the Step Function's Map state.
// Example input `event`: { studioId: 'ChIJ...', name: 'Some Tattoo Shop', website: 'https://some-studio.com' }
FUNCTION handler(event):
    LOG_INFO("Attempting to find artists on site.", { studioName: event.name, website: event.website });

    IF NOT event.website:
        LOG_WARN("Studio has no website, skipping.", { studioName: event.name });
        RETURN { artists: [] }; // Return empty list to continue workflow
    END IF

    // 1. Fetch the Website HTML
    TRY:
        CONSTANT response = CALL httpClient.get(event.website, { timeout: 5000 }); // Use a timeout
        CONSTANT html = response.data;
    CATCH error:
        LOG_ERROR("Failed to fetch website HTML.", { website: event.website, error });
        // IMPORTANT: Return an empty list, not an error, so the Step Function can continue.
        RETURN { artists: [] };
    END TRY

    // 2. Scrape the HTML for Artist Links
    // This is the core developer task and may require refinement.
    TRY:
        CONSTANT $ = cheerio.load(html);
        CONSTANT foundProfiles = new Map(); // Use a Map to avoid duplicate URLs.

        // STRATEGY: Find all anchor tags `<a>` whose `href` contains "instagram.com/".
        // This is a common pattern for artist portfolios on studio websites.
        // The selector might need to be more specific, e.g., targeting a div with class "artists".
        EACH link IN $('a[href*="instagram.com"]'):
            CONSTANT portfolioUrl = $(link).attr('href');
            
            // Basic validation and cleaning of the URL.
            IF portfolioUrl AND is_valid_instagram_url(portfolioUrl):
                // Try to get a meaningful name. Use the link text, or an image alt tag, or fallback to a generic name.
                CONSTANT artistName = $(link).text().trim() || `Artist from ${event.name}`;
                
                // Add to map, automatically handling duplicates.
                foundProfiles.set(portfolioUrl, {
                    artistName: artistName,
                    portfolioUrl: portfolioUrl,
                    sourceStudioId: event.studioId
                });
            END IF
        END EACH

        CONSTANT artists = Array.from(foundProfiles.values());
        LOG_INFO(`Found ${artists.length} potential artist profiles.`, { website: event.website });

        // 3. Return the list of found artists
        // This output is collected by the Step Function's Map state.
        RETURN { artists: artists };

    CATCH error:
        LOG_ERROR("An error occurred during HTML parsing/scraping.", { website: event.website, error });
        // Again, return an empty list to ensure the workflow continues.
        RETURN { artists: [] };
    END TRY

END FUNCTION

// --- Helper Function ---
FUNCTION is_valid_instagram_url(url):
    // Implement logic to filter out links to the studio's own Instagram, etc.
    // e.g., return false if url is "instagram.com/thestudio"
    // e.g., return true if url is "instagram.com/someartist"
    RETURN true;
END FUNCTION
