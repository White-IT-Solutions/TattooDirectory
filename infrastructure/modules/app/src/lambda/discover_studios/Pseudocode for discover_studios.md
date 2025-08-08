// Filename: discover_studios.js

// --- Dependencies ---
// IMPORT the AWS SDK v3 client for Secrets Manager.
// IMPORT an HTTP client like 'axios' for making API calls.
// IMPORT the shared, PII-scrubbing logger from '../common/logger'.

// --- Initialization ---
// INITIALIZE the Secrets Manager client and Axios client outside the handler for reuse.
const secretsManagerClient = new SecretsManagerClient({});
const httpClient = axios.create();

// --- Main Handler ---
// This function is the entry point for the Step Function.
FUNCTION handler(event):
    LOG_INFO("Starting studio discovery process.", { search_criteria: event.search_criteria || "tattoo studios in London" });

    // 1. Securely Fetch API Key
    // The API key for the external service should be stored in AWS Secrets Manager.
    TRY:
        CONSTANT secret_arn = GET_FROM_ENV("PLACES_API_SECRET_ARN");
        CONSTANT secret_response = CALL SecretsManagerClient.getSecretValue({ SecretId: secret_arn });
        CONSTANT apiKey = PARSE_JSON(secret_response.SecretString).api_key;
    CATCH error:
        LOG_ERROR("Failed to retrieve API key from Secrets Manager.", { error });
        // Fail fast if we can't get credentials.
        THROW new Error("Could not retrieve API credentials.");
    END TRY

    // 2. Call the External API
    // Use the fetched API key to query the external service.
    TRY:
        // The search query could be passed in the event or configured as an environment variable.
        CONSTANT searchQuery = event.search_criteria || "tattoo studios in London";
        CONSTANT apiResponse = CALL httpClient.get("https://maps.googleapis.com/maps/api/place/textsearch/json", {
            params: {
                query: searchQuery,
                key: apiKey
            }
        });

        IF apiResponse.data.status IS NOT "OK":
            THROW new Error(`Places API returned status: ${apiResponse.data.status}`);
        END IF

        CONSTANT results = apiResponse.data.results;
        LOG_INFO(`Received ${results.length} potential studios from external API.`);

    CATCH error:
        LOG_ERROR("Failed to call or process response from the external Places API.", { error });
        THROW new Error("External API call failed.");
    END TRY

    // 3. Format the Results for the Next Step
    // The next step (`find_artists_on_site`) needs a list of studios with websites.
    CONSTANT discoveredItems = [];
    FOR EACH studio IN results:
        // We only care about studios that have a website we can scrape.
        IF studio.website:
            discoveredItems.push({
                studioId: studio.place_id, // A unique identifier from the API
                name: studio.name,
                website: studio.website
            });
        END IF
    END FOR

    LOG_INFO(`Formatted ${discoveredItems.length} studios with websites for the next step.`);

    // 4. Return the list to the Step Function
    // This output becomes the input for the next state (the Map state that runs find_artists_on_site).
    RETURN {
        discoveredItems: discoveredItems
    };

END FUNCTION