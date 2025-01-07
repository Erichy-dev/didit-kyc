import express from 'express';
import dotenv from 'dotenv';
import { sessionRoutes } from './routes/session';
import { webhookRoutes } from './routes/webhook';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT;
const url = process.env.URL;
const apiUrl = process.env.API_URL;
const verificationUrl = process.env.VERIFICATION_URL;
const webhookSecret = process.env.WEBHOOK_SECRET_KEY;

// Middleware
app.use(express.json());

// Initialize routes
if (!apiUrl || !verificationUrl) {
  throw new Error('API_URL and VERIFICATION_URL environment variables are required');
}

const routes = sessionRoutes(apiUrl, verificationUrl);

if (!webhookSecret) {
  throw new Error('WEBHOOK_SECRET_KEY environment variable is required');
}

const webhook = webhookRoutes(webhookSecret);

// Register routes
app.post('/auth/v2/token', routes.createToken);
app.post('/v1/session', routes.createSession);
app.get('/v1/session/:sessionId/decision', routes.getSessionDecision);
app.post('/webhook', webhook.handleWebhook);

// Start server
app.listen(port, () => {
  console.log(`Server running at ${url}`);
}); 
