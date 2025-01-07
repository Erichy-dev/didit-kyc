import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { randomBytes } from 'crypto';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT;
const url = process.env.URL;
const apiUrl = process.env.API_URL;
const verificationUrl = process.env.VERIFICATION_URL;

// Middleware
app.use(express.json());

// Types
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SessionResponse {
  session_id: string;
  url: string;
}

// Update helper function to be async
async function createAutomaticSession(): Promise<SessionResponse> {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  
  // Get token first
  const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  try {
    // Get token
    const tokenResponse = await fetch(`${url}/auth/v2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const tokenData: TokenResponse = await tokenResponse.json();

    // Create session
    const sessionResponse = await fetch(`${url}/v1/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        features: "OCR + NFC + FACE",
        callback: `${url}`,
        vendor_data: "some_user_id"
      }),
    });

    return await sessionResponse.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Routes
app.get('/', async (req: Request, res: Response) => {
  try {
    const sessionDetails = await createAutomaticSession();
    
    res.send(`
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
              <h1>Welcome to My TypeScript Node.js Site</h1>
              <p>This is a minimalist Express backend serving a single page.</p>
              
              <div class="session-info">
                  <h2>Session Details</h2>
                  <p><strong>Session ID:</strong> ${sessionDetails.session_id}</p>
                  <p><strong>Verification URL:</strong><br>
                  <a href="${sessionDetails.url}" class="verify-link" target="_blank">${sessionDetails.url}</a></p>
              </div>
          </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error creating session');
  }
});

// Token endpoint
app.post('/auth/v2/token', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Basic ')) {
    res.status(401).json({ error: 'Invalid authorization header' });
    return;
  }

  try {
    // Forward the request to the actual API
    const tokenResponse = await fetch(`${apiUrl}/auth/v2/token`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      res.status(tokenResponse.status).json(tokenData);
      return;
    }

    res.json(tokenData);
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

// Session endpoint
app.post('/v1/session', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Invalid authorization header' });
    return;
  }

  const { features, callback, vendor_data } = req.body;

  if (!features || !callback || !vendor_data) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    // Use verification.didit.me for session creation
    const sessionResponse = await fetch(`${verificationUrl}/v1/session/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        features,
        callback,
        vendor_data
      }),
    });

    const sessionData = await sessionResponse.json();
    
    if (!sessionResponse.ok) {
      res.status(sessionResponse.status).json(sessionData);
      return;
    }

    res.status(201).json(sessionData);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at ${url}`);
}); 
