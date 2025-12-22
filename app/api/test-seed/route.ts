
import { NextResponse } from 'next/server';
import pool, { saveProduct } from '@/lib/db';
import { Product } from '@/lib/types';

export async function GET() {
    try {
        console.log("Seed route hit");

        const product: Product = {
            id: 'demo-shirt-1',
            name: 'Premium Cotton Shirt',
            description: 'High-quality cotton shirt.',
            price: 1299,
            category: 'Shirts',
            stock: 50,
            imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=2070&auto=format&fit=crop',
            isActive: true,
            sizes: [{ size: 'M', stock: 20 }]
        };

        // Try to save directly. lib/db.ts handles pool.
        // If pool fails, saveProduct throws.
        await saveProduct(product);

        return NextResponse.json({ message: 'Seeding Successful', product });
    } catch (error) {
        return NextResponse.json({
            error: (error as Error).message,
            env_db_exists: !!process.env.DATABASE_URL,
            env_keys: Object.keys(process.env).filter(k => k.includes('DB') || k.includes('POSTGRES'))
        }, { status: 200 });
    }
}
