<?php
// Load environment variables from .env file
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            putenv("$key=$value");
        }
    }
}

// index.php

// Add this helper function at the top with other functions
function createAutomaticSession() {
    // First, create the token internally
    $clientId = getenv('CLIENT_ID');
    $clientSecret = getenv('CLIENT_SECRET');
    
    // Generate token
    $token = bin2hex(random_bytes(32));
    
    // Create session data
    $sessionData = [
        'features' => ['document', 'face'], // Add your required features
        'callback' => 'https://your-callback-url.com', // Add your callback URL
        'vendor_data' => ['key' => 'value'] // Add your vendor data
    ];
    
    // Simulate session creation
    $sessionId = bin2hex(random_bytes(16));
    
    return [
        'session_id' => $sessionId,
        'url' => 'https://verification.didit.me/verify/' . $sessionId
    ];
}

// Basic routing
$request = $_SERVER['REQUEST_URI'];

// Simple router
function router($request) {
    // Remove query strings and trailing slash
    $path = parse_url($request, PHP_URL_PATH);
    $path = rtrim($path, '/');
    
    // If root path or /home, show homepage
    if ($path == '' || $path == '/home') {
        return showHomePage();
    } elseif ($path == '/auth/v2/token') {
        return handleTokenRequest();
    } elseif ($path == '/v1/session') {
        return handleSessionRequest();
    } else {
        return show404();
    }
}

// Homepage handler
function showHomePage() {
    // Get session details
    $sessionDetails = createAutomaticSession();
    
    return <<<HTML
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                max-width: 600px;
            }
            h1 {
                color: #333;
                margin-top: 0;
            }
            .session-info {
                background-color: #f0f0f0;
                padding: 1rem;
                border-radius: 4px;
                margin-top: 1rem;
            }
            .verify-link {
                color: #0066cc;
                text-decoration: none;
                word-break: break-all;
            }
            .verify-link:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome to My Simple PHP Site</h1>
            <p>This is a minimalist PHP backend serving a single page.</p>
            
            <div class="session-info">
                <h2>Session Details</h2>
                <p><strong>Session ID:</strong> {$sessionDetails['session_id']}</p>
                <p><strong>Verification URL:</strong><br>
                <a href="{$sessionDetails['url']}" class="verify-link" target="_blank">{$sessionDetails['url']}</a></p>
            </div>
        </div>
    </body>
    </html>
    HTML;
}

// 404 handler
function show404() {
    http_response_code(404);
    return '<h1>404 - Page Not Found</h1>';
}

// Add this new function
function handleTokenRequest() {
    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        return json_encode(['error' => 'Method not allowed']);
    }

    // Get Authorization header
    $headers = getallheaders();
    $auth = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (!preg_match('/^Basic (.+)$/', $auth, $matches)) {
        http_response_code(401);
        return json_encode(['error' => 'Invalid authorization header']);
    }

    // Decode credentials
    $credentials = base64_decode($matches[1]);
    list($clientId, $clientSecret) = explode(':', $credentials);

    // Verify credentials against .env values
    if ($clientId !== getenv('CLIENT_ID') || $clientSecret !== getenv('CLIENT_SECRET')) {
        http_response_code(401);
        return json_encode(['error' => 'Invalid credentials']);
    }

    // Verify grant_type
    if (!isset($_POST['grant_type']) || $_POST['grant_type'] !== 'client_credentials') {
        http_response_code(400);
        return json_encode(['error' => 'Invalid grant_type']);
    }

    // Generate token (you might want to use a more secure method)
    $token = bin2hex(random_bytes(32));
    
    header('Content-Type: application/json');
    return json_encode([
        'access_token' => $token,
        'token_type' => 'Bearer',
        'expires_in' => 3600
    ]);
}

// Add new session handler function
function handleSessionRequest() {
    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        return json_encode(['error' => 'Method not allowed']);
    }

    // Verify Bearer token
    $headers = getallheaders();
    $auth = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (!preg_match('/^Bearer (.+)$/', $auth, $matches)) {
        http_response_code(401);
        return json_encode(['error' => 'Invalid authorization header']);
    }

    // Get JSON request body
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // Validate required fields
    if (!isset($data['features']) || !isset($data['callback']) || !isset($data['vendor_data'])) {
        http_response_code(400);
        return json_encode(['error' => 'Missing required fields']);
    }

    // Create session (mock response for now)
    $sessionId = bin2hex(random_bytes(16));
    
    http_response_code(201);
    header('Content-Type: application/json');
    return json_encode([
        'session_id' => $sessionId,
        'url' => 'https://verification.didit.me/verify/' . $sessionId
    ]);
}

// Output the response
echo router($request);