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

app.post('/', async (req: any, res: any) => {
  console.log('Incoming webhook request:', {
    headers: req.headers,
    ip: req.ip,
    method: req.method,
    path: req.path
  });

  const signature = req.headers['x-signature'] as string;
  const rawBody = req.rawBody.toString('utf8');
  
  if (!signature) {
    console.warn('Request rejected: Missing signature header');
    return res.status(401).json({ error: 'Missing signature' });
  }

  if (!rawBody) {
    console.warn('Request rejected: Empty request body');
    return res.status(400).json({ error: 'Missing request body' });
  }

  console.log('Raw request body:', rawBody);

  let body;
  try {
    body = JSON.parse(rawBody);
    console.log('Parsed webhook payload:', body);
  } catch (error) {
    console.error('JSON parsing failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      rawBody
    });
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!body.created_at) {
    console.warn('Request rejected: Missing timestamp', { body });
    return res.status(400).json({ error: 'Missing created_at timestamp' });
  }

  console.log('Attempting signature verification:', {
    timestamp: body.created_at,
    currentTime: Math.floor(Date.now() / 1000)
  });

  if (!verifySignature(rawBody, signature, body.created_at)) {
    console.warn('Request rejected: Invalid signature', {
      providedSignature: signature,
      timestamp: body.created_at
    });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { session_id, status, vendor_data } = body;
  console.log('Processing webhook:', {
    session_id,
    status,
    vendor_data,
    timestamp: new Date().toISOString()
  });

  // Handle the webhook event
  res.json({ received: true });
  console.log('Webhook processed successfully:', { session_id });
});

app.listen(webhookPort, () => {
  console.log(`Webhook server listening on port ${webhookPort}`);
}); 