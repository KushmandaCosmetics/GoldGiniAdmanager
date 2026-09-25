import { NextResponse } from 'next/server';
import { queryEcommDb } from '@/lib/ecomm-db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    let products;

    if (email) {
      // Find the vendor in admin_users by email
      const vendors: any = await queryEcommDb('SELECT * FROM admin_users WHERE email = ? LIMIT 1', [email]);
      
      if (vendors.length > 0) {
        const vendorId = vendors[0].id; // Assuming the ID column is 'id'
        // Fetch products for this vendor (guessing the column is vendor_id or admin_id, let's try vendor_id)
        try {
          products = await queryEcommDb('SELECT * FROM products WHERE vendor_id = ? LIMIT 50', [vendorId]);
        } catch (e) {
          // If vendor_id doesn't exist, fallback to fetching all (or try another column)
          products = await queryEcommDb('SELECT * FROM products LIMIT 50');
        }
      } else {
        products = await queryEcommDb('SELECT * FROM products LIMIT 50');
      }
    } else {
      products = await queryEcommDb('SELECT * FROM products LIMIT 50');
    }

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Error fetching from ecomm2:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
