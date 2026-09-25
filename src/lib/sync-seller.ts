import { prisma } from '@/lib/prisma';
import { queryEcommDb } from '@/lib/ecomm-db';

export async function ensureSellerExists(sellerId: number) {
  // Check if it already exists in the Ad Manager DB
  const existingSeller = await prisma.seller.findUnique({
    where: { id: sellerId }
  });

  if (existingSeller) {
    return existingSeller;
  }

  // It doesn't exist, so we sync it from the ecomm DB
  try {
    const vendors: any = await queryEcommDb('SELECT * FROM admin_users WHERE id = ?', [sellerId]);
    
    if (vendors.length > 0) {
      const v = vendors[0];
      return await prisma.seller.create({
        data: {
          id: sellerId,
          email: v.email || `vendor${sellerId}@goldgini.com`,
          name: v.username || v.first_name || 'Vendor',
          shopName: v.store_name || v.shop_name || 'My Shop',
          passwordHash: 'synced_from_ecomm',
        }
      });
    } else {
      // Fallback if somehow they have a JWT but no longer in admin_users
      return await prisma.seller.create({
        data: {
          id: sellerId,
          email: `vendor${sellerId}@goldgini.com`,
          name: 'Vendor',
          shopName: 'My Shop',
          passwordHash: 'synced_from_ecomm_fallback',
        }
      });
    }
  } catch (error) {
    console.error('Error syncing seller from ecomm DB:', error);
    // If DB fails, create dummy to prevent foreign key errors
    return await prisma.seller.create({
      data: {
        id: sellerId,
        email: `vendor${sellerId}@goldgini.com`,
        name: 'Vendor',
        shopName: 'My Shop',
        passwordHash: 'synced_from_ecomm_fallback',
      }
    });
  }
}
