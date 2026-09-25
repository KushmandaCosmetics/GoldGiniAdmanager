import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  shopName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { name, shopName, email, password } = parsed.data;

    const existingUser = await prisma.seller.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const seller = await prisma.seller.create({
      data: {
        name,
        shopName,
        email,
        passwordHash,
        wallet: {
          create: { balance: 0.00 }
        }
      },
      include: {
        wallet: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      seller: { id: seller.id, email: seller.email, shopName: seller.shopName } 
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
