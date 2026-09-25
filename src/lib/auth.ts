import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'goldgini-ad-manager-super-secret-jwt-key-change-in-production-2024';
const key = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  sellerId: number;
  email: string;
  name: string;
  shopName: string;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}
