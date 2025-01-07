import express from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const webhookPort = process.env.WEBHOOK_PORT;
const webhookSecret = process.env.WEBHOOK_SECRET_KEY;

if (!webhookSecret || !webhookPort) {
  throw new Error('WEBHOOK_SECRET_KEY and WEBHOOK_PORT environment variables are required');
}

// Middleware to get raw body for signature verification
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

function verifySignature(
  rawBody: string,
  signature: string,
  timestamp: number,
): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > 300) {
    console.log('Timestamp validation failed:', { currentTime, timestamp });
    return false;
  }

  const expectedSignature = createHmac('sha256', webhookSecret as string)
    .update(rawBody)
    .digest('hex');

  console.log('Expected signature:', expectedSignature);
  console.log('Provided signature:', signature);

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const providedBuffer = Buffer.from(signature, 'hex');

  return expectedBuffer.length === providedBuffer.length &&
         timingSafeEqual(expectedBuffer, providedBuffer);
}

app.post('/webhook', async (req: any, res: any) => {
  const signature = req.headers['x-signature'] as string;
  const rawBody = req.rawBody.toString('utf8');
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  if (!rawBody) {
    return res.status(400).json({ error: 'Missing request body' });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!body.created_at) {
    return res.status(400).json({ error: 'Missing created_at timestamp' });
  }

  if (!verifySignature(rawBody, signature, body.created_at)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { session_id, status, vendor_data } = body;
  console.log('Webhook received:', { session_id, status, vendor_data });

  // Handle the webhook event
  res.json({ received: true });
});

app.listen(webhookPort, () => {
  console.log(`Webhook server listening on port ${webhookPort}`);
}); 