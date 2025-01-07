interface TokenResponse {
  access_token: string;
  expires_in: number;
}

let cachedToken: TokenResponse | null = null;
let tokenExpirationTime: number | null = null;

export async function getAuthToken(): Promise<string> {
  if (cachedToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
    return cachedToken.access_token;
  }

  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const url = process.env.API_URL || 'http://localhost:3000';

  const encodedCredentials = Buffer.from(
    `${clientId}:${clientSecret}`,
  ).toString('base64');
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  try {
    const response = await fetch(`${url}/auth/v2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch token');
    }

    const data: TokenResponse = await response.json();
    cachedToken = data;
    tokenExpirationTime = Date.now() + (data.expires_in * 1000) - 60000;

    return data.access_token;
  } catch (error) {
    console.error('Error fetching auth token:', error);
    throw error;
  }
} 