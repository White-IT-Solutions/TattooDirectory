# 📡 API Reference

Complete API documentation for {{PROJECT_NAME}}.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URLs](#base-urls)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Examples](#examples)

## Overview

{{API_OVERVIEW_DESCRIPTION}}

### API Version

**Current Version**: `{{API_VERSION}}`
**Base URL**: `{{BASE_URL}}`

### Supported Formats

{{#SUPPORTED_FORMATS}}
- **{{FORMAT_NAME}}**: {{FORMAT_DESCRIPTION}}
{{/SUPPORTED_FORMATS}}

## Authentication

{{AUTHENTICATION_DESCRIPTION}}

### Authentication Methods

{{#AUTH_METHODS}}
#### {{AUTH_METHOD_NAME}}

{{AUTH_METHOD_DESCRIPTION}}

**Headers**:
```http
{{AUTH_HEADERS}}
```

**Example**:
```bash
{{AUTH_EXAMPLE}}
```
{{/AUTH_METHODS}}

## Base URLs

{{#BASE_URLS}}
- **{{ENVIRONMENT}}**: `{{URL}}`
{{/BASE_URLS}}

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {{SUCCESS_DATA_EXAMPLE}},
  "meta": {
    "timestamp": "{{TIMESTAMP_FORMAT}}",
    "version": "{{API_VERSION}}"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "{{ERROR_CODE}}",
    "message": "{{ERROR_MESSAGE}}",
    "details": {{ERROR_DETAILS}}
  },
  "meta": {
    "timestamp": "{{TIMESTAMP_FORMAT}}",
    "version": "{{API_VERSION}}"
  }
}
```

## Error Handling

### HTTP Status Codes

{{#HTTP_STATUS_CODES}}
- **{{STATUS_CODE}}**: {{STATUS_DESCRIPTION}}
{{/HTTP_STATUS_CODES}}

### Error Codes

{{#ERROR_CODES}}
#### {{ERROR_CODE}}

**Description**: {{ERROR_DESCRIPTION}}
**HTTP Status**: {{HTTP_STATUS}}
**Resolution**: {{ERROR_RESOLUTION}}

**Example**:
```json
{{ERROR_EXAMPLE}}
```
{{/ERROR_CODES}}

## Rate Limiting

{{RATE_LIMITING_DESCRIPTION}}

### Rate Limits

{{#RATE_LIMITS}}
- **{{ENDPOINT_PATTERN}}**: {{RATE_LIMIT}} requests per {{TIME_WINDOW}}
{{/RATE_LIMITS}}

### Rate Limit Headers

```http
X-RateLimit-Limit: {{RATE_LIMIT}}
X-RateLimit-Remaining: {{REMAINING_REQUESTS}}
X-RateLimit-Reset: {{RESET_TIMESTAMP}}
```

## API Endpoints

{{#API_SECTIONS}}
### {{SECTION_NAME}}

{{SECTION_DESCRIPTION}}

{{#ENDPOINTS}}
#### {{METHOD}} {{ENDPOINT_PATH}}

{{ENDPOINT_DESCRIPTION}}

**Parameters**:

{{#PATH_PARAMETERS}}
- `{{PARAM_NAME}}` ({{PARAM_TYPE}}, required): {{PARAM_DESCRIPTION}}
{{/PATH_PARAMETERS}}

{{#QUERY_PARAMETERS}}
**Query Parameters**:
- `{{PARAM_NAME}}` ({{PARAM_TYPE}}, {{PARAM_REQUIRED}}): {{PARAM_DESCRIPTION}}
  {{#PARAM_OPTIONS}}
  - `{{OPTION_VALUE}}`: {{OPTION_DESCRIPTION}}
  {{/PARAM_OPTIONS}}
{{/QUERY_PARAMETERS}}

{{#REQUEST_BODY}}
**Request Body**:
```json
{{REQUEST_BODY_EXAMPLE}}
```
{{/REQUEST_BODY}}

**Response**:
```json
{{RESPONSE_EXAMPLE}}
```

**Example Request**:
```bash
curl -X {{METHOD}} \
  "{{BASE_URL}}{{ENDPOINT_PATH}}" \
  {{#REQUEST_HEADERS}}
  -H "{{HEADER_NAME}}: {{HEADER_VALUE}}" \
  {{/REQUEST_HEADERS}}
  {{#REQUEST_BODY}}
  -d '{{REQUEST_BODY_JSON}}'
  {{/REQUEST_BODY}}
```

**Example Response**:
```json
{{FULL_RESPONSE_EXAMPLE}}
```

{{/ENDPOINTS}}
{{/API_SECTIONS}}

## Data Models

{{#DATA_MODELS}}
### {{MODEL_NAME}}

{{MODEL_DESCRIPTION}}

**Schema**:
```json
{
  {{#MODEL_PROPERTIES}}
  "{{PROPERTY_NAME}}": {
    "type": "{{PROPERTY_TYPE}}",
    "description": "{{PROPERTY_DESCRIPTION}}",
    {{#PROPERTY_REQUIRED}}
    "required": true,
    {{/PROPERTY_REQUIRED}}
    {{#PROPERTY_FORMAT}}
    "format": "{{PROPERTY_FORMAT}}",
    {{/PROPERTY_FORMAT}}
    {{#PROPERTY_ENUM}}
    "enum": [{{PROPERTY_ENUM_VALUES}}],
    {{/PROPERTY_ENUM}}
    {{#PROPERTY_EXAMPLE}}
    "example": {{PROPERTY_EXAMPLE}}
    {{/PROPERTY_EXAMPLE}}
  }{{#PROPERTY_NOT_LAST}},{{/PROPERTY_NOT_LAST}}
  {{/MODEL_PROPERTIES}}
}
```

**Example**:
```json
{{MODEL_EXAMPLE}}
```

{{#MODEL_RELATIONSHIPS}}
**Relationships**:
{{#RELATIONSHIPS}}
- **{{RELATIONSHIP_NAME}}**: {{RELATIONSHIP_DESCRIPTION}}
{{/RELATIONSHIPS}}
{{/MODEL_RELATIONSHIPS}}

{{/DATA_MODELS}}

## Examples

### Common Use Cases

{{#USE_CASES}}
#### {{USE_CASE_NAME}}

{{USE_CASE_DESCRIPTION}}

**Steps**:
{{#USE_CASE_STEPS}}
{{STEP_NUMBER}}. {{STEP_DESCRIPTION}}
   ```bash
   {{STEP_COMMAND}}
   ```
{{/USE_CASE_STEPS}}

**Complete Example**:
```bash
{{USE_CASE_COMPLETE_EXAMPLE}}
```
{{/USE_CASES}}

### SDK Examples

{{#SDK_EXAMPLES}}
#### {{SDK_NAME}}

**Installation**:
```bash
{{SDK_INSTALL_COMMAND}}
```

**Usage**:
```{{SDK_LANGUAGE}}
{{SDK_USAGE_EXAMPLE}}
```
{{/SDK_EXAMPLES}}

### Postman Collection

{{POSTMAN_COLLECTION_DESCRIPTION}}

**Import URL**: `{{POSTMAN_COLLECTION_URL}}`

## Webhooks

{{#WEBHOOKS_ENABLED}}
### Webhook Events

{{WEBHOOKS_DESCRIPTION}}

{{#WEBHOOK_EVENTS}}
#### {{EVENT_NAME}}

**Trigger**: {{EVENT_TRIGGER}}
**Payload**:
```json
{{EVENT_PAYLOAD_EXAMPLE}}
```
{{/WEBHOOK_EVENTS}}

### Webhook Configuration

```bash
# Configure webhook endpoint
{{WEBHOOK_CONFIG_COMMAND}}
```
{{/WEBHOOKS_ENABLED}}

## Testing

### API Testing Tools

{{#TESTING_TOOLS}}
- **{{TOOL_NAME}}**: {{TOOL_DESCRIPTION}}
  ```bash
  {{TOOL_USAGE}}
  ```
{{/TESTING_TOOLS}}

### Test Environment

**Base URL**: `{{TEST_BASE_URL}}`
**Test Data**: {{TEST_DATA_DESCRIPTION}}

```bash
# Setup test environment
{{TEST_SETUP_COMMAND}}

# Run API tests
{{API_TEST_COMMAND}}
```

## Changelog

{{#API_CHANGELOG}}
### Version {{VERSION}} ({{RELEASE_DATE}})

{{#VERSION_CHANGES}}
- **{{CHANGE_TYPE}}**: {{CHANGE_DESCRIPTION}}
{{/VERSION_CHANGES}}
{{/API_CHANGELOG}}

## Support

### Getting Help

- 📖 [Development Guide](./DEVELOPMENT_GUIDE.md)
- 🔧 [Troubleshooting](./TROUBLESHOOTING.md)
- 💬 [Discussions]({{DISCUSSIONS_URL}})
- 🐛 [Issues]({{ISSUES_URL}})

### API Status

**Status Page**: {{STATUS_PAGE_URL}}
**Uptime**: {{API_UPTIME}}

---

**Last Updated**: {{LAST_UPDATED}}
**API Version**: {{API_VERSION}}