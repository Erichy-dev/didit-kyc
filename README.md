# WEBHOOK SERVER APPLICATION

A secure webhook server implementation with signature verification, session management, and authentication endpoints.

## FEATURES

* Secure webhook endpoint with HMAC-SHA256 signature verification
* Session management with creation and decision endpoints
* OAuth2 token management
* Detailed request logging and monitoring
* JSON payload validation
* Environment-based configuration
* Error handling with informative responses

## PREREQUISITES

* Node.js (v14 or higher)
* npm or yarn
* OAuth2 client credentials
* A webhook secret key for signature verification

## INSTALLATION

1. Clone the repository:

```bash
git clone `repository-url`
cd `project-directory`
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp env.example .env
# (Edit the .env file with your configuration values)
```

## CONFIGURATION

The following environment variables are required:

```env
PORT                # Main application port
CLIENT_ID           # OAuth2 client ID
CLIENT_SECRET       # OAuth2 client secret
URL                 # Application base URL
API_URL             # OAuth2 token endpoint
VERIFICATION_URL    # Session verification service URL
WEBHOOK_SECRET_KEY  # Secret key for webhook signatures
WEBHOOK_PORT        # Port for webhook server
```

## API ENDPOINTS

### Authentication

```bash
POST /auth/v2/token
# Generates OAuth2 access token
Headers: Basic authentication
```

### Session Management

```bash
POST /v1/session
# Creates a new verification session
Headers: Bearer token
Body: {
  "features": [],
  "callback": "string",
  "vendor_data": "string"
}

GET /v1/session/:sessionId/decision
# Retrieves session decision
Headers: Bearer token
```

### Webhook

```bash
POST /webhook
# Receives verification status updates
Headers: {
  "x-signature": "HMAC-SHA256 signature",
  "x-timestamp": "Unix timestamp"
}
Body: {
  "session_id": "string",
  "status": "string",
  "vendor_data": "string",
  "created_at": "timestamp"
}
```

## TESTING WEBHOOKS

A test script is provided to generate webhook signatures:

```bash
npm run generate-webhook-test
```

This will output test values including:
* Timestamp
* Signature
* Sample payload

## SECURITY

* OAuth2 authentication for session endpoints
* HMAC-SHA256 webhook signature verification
* Timestamp validation to prevent replay attacks
* Raw request body validation
* Secure comparison using timing-safe equality

## LOGGING

The application includes comprehensive logging:

* Request details (headers, IP, method)
* Webhook payload validation
* Signature verification
* Session operations
* Error scenarios

## ERROR HANDLING

The application handles various error cases:
* Invalid authentication
* Missing required fields
* Invalid signatures
* Expired timestamps
* API communication errors

