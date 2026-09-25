import crypto from 'crypto';

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret-for-development-only';

export function generateImpressionToken(campaignId: number, adId: number, actualCpc: number): string {
  const payload = `${campaignId}:${adId}:${actualCpc}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  // Return base64 encoded string combining payload and signature
  return Buffer.from(`${payload}|${signature}`).toString('base64');
}

export function verifyImpressionToken(token: string): { valid: boolean; campaignId?: number; adId?: number; actualCpc?: number; ageMs?: number } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [payload, signature] = decoded.split('|');
    
    if (!payload || !signature) return { valid: false };
    
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    
    if (signature !== expectedSignature) {
      return { valid: false };
    }
    
    const [campaignIdStr, adIdStr, actualCpcStr, timestampStr] = payload.split(':');
    const campaignId = parseInt(campaignIdStr, 10);
    const adId = parseInt(adIdStr, 10);
    const actualCpc = parseFloat(actualCpcStr);
    const timestamp = parseInt(timestampStr, 10);
    
    const ageMs = Date.now() - timestamp;
    
    // Tokens expire after 24 hours (86400000 ms)
    if (ageMs > 86400000) {
      return { valid: false };
    }
    
    return {
      valid: true,
      campaignId,
      adId,
      actualCpc,
      ageMs
    };
  } catch (error) {
    return { valid: false };
  }
}
