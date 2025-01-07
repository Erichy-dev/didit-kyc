import { Request, Response } from 'express';

export const sessionRoutes = (api_url: string, verificationUrl: string) => {
  const routes = {
    // Token endpoint
    createToken: async (req: Request, res: Response): Promise<void> => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Basic ')) {
        res.status(401).json({ error: 'Invalid authorization header' });
        return;
      }

      try {
        const tokenResponse = await fetch(`${api_url}/auth/v2/token`, {
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
    },

    // Session endpoint
    createSession: async (req: Request, res: Response): Promise<void> => {
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
    },

    // Decision endpoint
    getSessionDecision: async (req: Request, res: Response): Promise<void> => {
      const authHeader = req.headers.authorization;
      const { sessionId } = req.params;
      
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Invalid authorization header' });
        return;
      }

      try {
        const decisionResponse = await fetch(`${verificationUrl}/v1/session/${sessionId}/decision/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
        });

        const decisionData = await decisionResponse.json();
        
        if (!decisionResponse.ok) {
          res.status(decisionResponse.status).json(decisionData);
          return;
        }

        res.json(decisionData);
      } catch (error) {
        console.error('Error fetching session decision:', error);
        res.status(500).json({ error: 'Failed to fetch session decision' });
      }
    }
  };

  return routes;
}; 