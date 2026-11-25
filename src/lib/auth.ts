import { SignJWT, jwtVerify } from 'jose';

// No hardcoded fallback: a public default secret lets anyone mint session tokens.
function getKey(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

function requireKey(): Uint8Array {
  const key = getKey();
  if (!key) throw new Error('JWT_SECRET must be set (at least 32 characters).');
  return key;
}

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
    .sign(requireKey());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const key = getKey();
    if (!key) return null;
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}
