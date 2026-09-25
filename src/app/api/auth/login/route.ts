import { NextRequest, NextResponse } from 'next/server';
import { queryEcommDb } from '../../../../lib/ecomm-db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signToken } from '../../../../lib/auth';
import { cookies } from 'next/headers';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Fetch vendor from ecomm2's admin_users table
    const vendors: any = await queryEcommDb('SELECT * FROM admin_users WHERE email = ? LIMIT 1', [email]);
    
    if (vendors.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials or account inactive' }, { status: 401 });
    }

    const seller = vendors[0];

    // Check if Laravel uses active/status flags (we will just assume they are active if they exist for now)
    
    // The ecomm2 database stores passwords in plain text (e.g. '2026'), not as bcrypt hashes
    let isMatch = false;
    if (seller.password.startsWith('$2y$') || seller.password.startsWith('$2a$') || seller.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, seller.password);
    } else {
      isMatch = (password === seller.password);
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Sign JWT with the ecomm2 seller ID
    const token = await signToken({
      sellerId: seller.id,
      email: seller.email,
      name: seller.name || seller.first_name || 'Vendor',
      shopName: seller.shop_name || seller.store_name || 'My Shop',
    });

    const cookieStore = await cookies();
    cookieStore.set('ad_manager_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({ 
      success: true, 
      seller: { 
        id: seller.id, 
        email: seller.email, 
        shopName: seller.shop_name || seller.store_name || 'My Shop' 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
