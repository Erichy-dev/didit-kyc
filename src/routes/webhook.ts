import { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

function verifyWebhookSignature(
  requestBody: string,
  signature: string,
  timestamp: number,
  secretKey: string
): boolean {
  // Check if timestamp is recent (within 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > 300) {
    return false;
  }

  // Calculate expected signature
  const expectedSignature = createHmac('sha256', secretKey)
    .update(requestBody)
    .digest('hex');

  const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');
  const providedSignatureBuffer = Buffer.from(signature, 'hex');

  return expectedSignatureBuffer.length === providedSignatureBuffer.length &&
         timingSafeEqual(expectedSignatureBuffer, providedSignatureBuffer);
}

export const webhookRoutes = (webhookSecret: string) => ({
  handleWebhook: async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['x-signature'] as string;
    const timestamp = req.headers['x-timestamp'] as string;
    const body = JSON.stringify(req.body);

    if (!signature || !timestamp) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!verifyWebhookSignature(body, signature, parseInt(timestamp), webhookSecret)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { session_id, status, vendor_data } = req.body;

    // TODO: Add your database logic here
    console.log('Webhook received:', { session_id, status, vendor_data });

    res.json({ message: 'Webhook event processed' });
  }
}); 