import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { randomBytes } from 'crypto';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT;
const url = process.env.URL;

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
app.post('/auth/v2/token', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Basic ')) {
    res.status(401).json({ error: 'Invalid authorization header' });
    return;
  }

  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
  const [clientId, clientSecret] = credentials.split(':');

  if (clientId !== process.env.CLIENT_ID || clientSecret !== process.env.CLIENT_SECRET) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (req.body.grant_type !== 'client_credentials') {
    res.status(400).json({ error: 'Invalid grant_type' });
    return;
  }

  const token = randomBytes(32).toString('hex');
  
  res.json({
    access_token: token,
    token_type: 'Bearer',
    expires_in: 3600
  });
});

// Session endpoint
app.post('/v1/session', (req: Request, res: Response): void => {
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

  const sessionId = randomBytes(16).toString('hex');
  
  res.status(201).json({
    session_id: sessionId,
    url: `https://verification.didit.me/verify/${sessionId}`
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at ${url}`);
}); 
