import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Full Name must be at least 2 characters'),
  shopName: z.string().trim().min(2, 'Shop Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((i) => i.message);
      console.warn('[AdsManager Registration 400] Validation failure:', parsed.error.issues);
      return NextResponse.json(
        {
          error: errorMessages[0] || 'Invalid input',
          details: parsed.error.issues,
          allErrors: errorMessages,
        },
        { status: 400 }
      );
    }

    const { name, shopName, email, password } = parsed.data;

    // Check if seller already exists
    const existingUser = await prisma.seller.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const seller = await prisma.seller.create({
      data: {
        name,
        shopName,
        email,
        passwordHash,
        wallet: {
          create: { balance: 0.00 },
        },
      },
      include: {
        wallet: true,
      },
    });

    // Auto-login: Sign JWT and set session cookie
    const token = await signToken({
      sellerId: seller.id,
      email: seller.email,
      name: seller.name,
      shopName: seller.shopName,
    });

    const cookieStore = await cookies();
    cookieStore.set('ad_manager_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json(
      {
        success: true,
        seller: { id: seller.id, email: seller.email, shopName: seller.shopName },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
