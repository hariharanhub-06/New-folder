import { MetadataRoute } from 'next';
import { getOrders } from '@/lib/api'; // Using existing API logic, but we need products. Let's check db.ts
import db from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://startupmenswear.in';

    // Get all products
    const productsRes = await db.query('SELECT id, updated_at FROM products WHERE is_active = true');
    const products = productsRes.rows;

    const productUrls = products.map((product) => ({
        url: `${baseUrl}/product/${product.id}`,
        lastModified: new Date(product.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/shop`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        ...productUrls,
    ];
}
