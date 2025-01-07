import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Your webhook secret (same as WEBHOOK_SECRET_KEY in .env)
const webhookSecret = process.env.WEBHOOK_SECRET_KEY;

if (!webhookSecret) {
  throw new Error('WEBHOOK_SECRET_KEY environment variable is required');
}

// Test payload
interface WebhookPayload {
    session_id: string;
    // status: 'Approved' | 'Rejected' | 'Pending';
    vendor_data: string;
}

const payload: WebhookPayload = {
    session_id: "1e326369-b546-49f8-bc79-fd56696500c6",
    // status: "Approved",
    vendor_data: "some_user"
};

// Current timestamp
const timestamp = Math.floor(Date.now() / 1000);

// Create signature (must use exact JSON string that will be sent)
const payloadString = JSON.stringify(payload);
const signature = crypto
    .createHmac('sha256', webhookSecret)
    .digest('hex');

console.log('=== Webhook Test Values ===');
console.log('x-timestamp:', timestamp);
console.log('x-signature:', signature);
console.log('\nPayload:', payloadString); 