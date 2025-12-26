
import { Pool } from 'pg';
import { Product, Order, Discount } from './types';

let pool: Pool;

if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.POSTGRES_PRISMA_URL) {
    // During build time or if env not set, avoid crashing
    console.warn("DATABASE_URL is not set. Database operations will fail.");
    // Mock pool or throw error later
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

// Use global singleton for dev environment to prevent pool exhaustion
declare global {
    var postgresPool: Pool | undefined;
}

if (process.env.NODE_ENV === 'production') {
    pool = new Pool({ connectionString, ssl: true });
} else {
    if (!global.postgresPool) {
        global.postgresPool = new Pool({ connectionString, ssl: true });
    }
    pool = global.postgresPool;
}

export default pool;

// Helper functions for Server Actions

export async function getProduct(id: string): Promise<Product | null> {
    const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    const row = res.rows[0];
    if (!row) return null;

    // Fetch sizes
    const sizeRes = await pool.query('SELECT size, stock, id FROM product_sizes WHERE product_id = $1', [id]);

    // Fetch applicable discounts
    const discountRes = await pool.query(`
        SELECT * FROM discounts 
        WHERE active = true 
        AND (
            (target_type = 'product' AND product_id = $1)
            OR 
            (target_type = 'category' AND category = $2)
        )
    `, [id, row.category]);

    const discounts = discountRes.rows.map((d: any) => ({
        id: d.id,
        discountType: d.discount_type,
        targetType: d.target_type,
        category: d.category,
        productId: d.product_id,
        quantity: d.quantity,
        price: d.price ? parseFloat(d.price) : undefined,
        percentage: d.percentage,
        active: d.active
    }));

    // Priority: Product Bundle > Product % > Category Bundle > Category %
    const productBundle = discounts.find(d => d.targetType === 'product' && d.discountType === 'bundle');
    const productPercent = discounts.find(d => d.targetType === 'product' && d.discountType === 'percentage');
    const categoryBundle = discounts.find(d => d.targetType === 'category' && d.discountType === 'bundle');
    const categoryPercent = discounts.find(d => d.targetType === 'category' && d.discountType === 'percentage');

    const bestDiscount = productBundle || productPercent || categoryBundle || categoryPercent;

    return {
        id: row.id,
        name: row.name,
        description: row.description,
        price: parseFloat(row.price),
        category: row.category,
        stock: row.stock,
        imageUrl: row.image_url,
        // Fix: Check if images is already parsed (JSONB) or string (TEXT)
        images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
        isActive: row.is_active,
        size: row.size,
        sizes: sizeRes.rows.map(r => ({ size: r.size, stock: r.stock, id: r.id })), // Map DB rows to Size objects
        weight: row.weight || 750,  // Default to 750 grams if not set
        activeDiscount: bestDiscount,
        discountPercentage: bestDiscount?.discountType === 'percentage' ? bestDiscount.percentage : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function getPaginatedProducts(filters: import('./types').ProductFilters): Promise<import('./types').PaginatedResponse<Product>> {
    const {
        page = 1,
        limit = 12,
        category,
        minPrice,
        maxPrice,
        sort = 'newest',
        search,
        includeInactive = false
    } = filters;

    const offset = (page - 1) * limit;
    const params: any[] = [];
    // Optimize: Exclude 'images' column (huge JSON) from list view to prevent RSC payload crash
    let query = 'SELECT id, name, description, price, category, stock, image_url, is_active, size, weight, created_at, updated_at FROM products WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM products WHERE 1=1';

    // 1. Build Filters
    if (!includeInactive) {
        query += ' AND is_active = true';
        countQuery += ' AND is_active = true';
    }

    if (category && category !== 'All Categories') {
        params.push(category);
        query += ` AND category = $${params.length}`;
        countQuery += ` AND category = $${params.length}`;
    }

    if (minPrice !== undefined) {
        params.push(minPrice);
        query += ` AND price >= $${params.length}`;
        countQuery += ` AND price >= $${params.length}`;
    }

    if (maxPrice !== undefined) {
        params.push(maxPrice);
        query += ` AND price <= $${params.length}`;
        countQuery += ` AND price <= $${params.length}`;
    }

    if (search) {
        params.push(`%${search}%`);
        query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
        countQuery += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    // 2. Sorting
    switch (sort) {
        case 'price_asc':
            query += ' ORDER BY price ASC';
            break;
        case 'price_desc':
            query += ' ORDER BY price DESC';
            break;
        case 'name_asc':
            query += ' ORDER BY name ASC';
            break;
        case 'newest':
        default:
            query += ' ORDER BY created_at DESC';
            break;
    }

    // 3. Pagination
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    // Execute Queries
    const [countRes, productsRes] = await Promise.all([
        pool.query(countQuery, params),
        pool.query(query, params)
    ]);

    const total = parseInt(countRes.rows[0].count);
    const rows = productsRes.rows;

    if (rows.length === 0) {
        return {
            data: [],
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // 4. Fetch Associations (Sizes & Discounts) for these products only
    const productIds = rows.map(r => r.id);

    // Fetch Sizes
    const sizeRes = await pool.query('SELECT * FROM product_sizes WHERE product_id = ANY($1)', [productIds]);
    const sizesMap = new Map();
    sizeRes.rows.forEach(r => {
        if (!sizesMap.has(r.product_id)) sizesMap.set(r.product_id, []);
        sizesMap.get(r.product_id).push({ size: r.size, stock: r.stock, id: r.id });
    });

    // Fetch Active Discounts (Global or related to these products)
    // For simplicity and correctness with "Category" discounts, we fetch all active discounts.
    // Optimization: In a huge system, we would filter this too, but for <100 discounts it's negligible compared to product data.
    const discountRes = await pool.query('SELECT * FROM discounts WHERE active = true');
    const allDiscounts = discountRes.rows.map((d: any) => ({
        id: d.id,
        discountType: d.discount_type,
        targetType: d.target_type,
        category: d.category,
        productId: d.product_id,
        quantity: d.quantity,
        price: d.price ? parseFloat(d.price) : undefined,
        percentage: d.percentage,
        active: d.active
    }));

    // 5. Map to Product Objects
    const products: Product[] = rows.map((row: any) => {
        const productPrice = parseFloat(row.price);

        // Find applicable discounts
        const productBundle = allDiscounts.find(d =>
            d.targetType === 'product' && d.productId === row.id && d.discountType === 'bundle');
        const productPercent = allDiscounts.find(d =>
            d.targetType === 'product' && d.productId === row.id && d.discountType === 'percentage');
        const categoryBundle = allDiscounts.find(d =>
            d.targetType === 'category' && d.category === row.category && d.discountType === 'bundle');
        const categoryPercent = allDiscounts.find(d =>
            d.targetType === 'category' && d.category === row.category && d.discountType === 'percentage');

        const bestDiscount = productBundle || productPercent || categoryBundle || categoryPercent;

        return {
            id: row.id,
            name: row.name,
            description: row.description,
            price: productPrice,
            category: row.category,
            stock: row.stock,
            imageUrl: row.image_url,
            images: row.images ? JSON.parse(row.images) : [],
            isActive: row.is_active,
            size: row.size,
            sizes: sizesMap.get(row.id) || [],
            weight: row.weight || 750,  // Default to 750 grams if not set
            activeDiscount: bestDiscount,
            discountPercentage: bestDiscount?.discountType === 'percentage' ? bestDiscount.percentage : undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    });

    return {
        data: products,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function saveProduct(product: Product) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Determine Final ID
        let finalId = product.id;

        // Check existence if ID provided
        let exists = false;
        if (finalId) {
            const res = await client.query('SELECT id FROM products WHERE id = $1', [finalId]);
            exists = !!res.rows[0];
        } else {
            // Generate new ID if missing
            finalId = crypto.randomUUID();
        }

        const totalStock = product.sizes ? product.sizes.reduce((acc, s) => acc + s.stock, 0) : product.stock;

        if (exists) {
            // Update Product
            await client.query(`
                UPDATE products 
                SET name = $1, description = $2, price = $3, category = $4, 
                    stock = $5, image_url = $6, images = $7, size = $8, is_active = $9, weight = $10, updated_at = CURRENT_TIMESTAMP
                WHERE id = $11
            `, [
                product.name,
                product.description,
                product.price,
                product.category,
                totalStock,
                product.imageUrl,
                JSON.stringify(product.images || []),
                product.size,
                product.isActive,
                product.weight || 750,
                finalId
            ]);
        } else {
            // Insert Product
            await client.query(`
                INSERT INTO products (id, name, description, price, category, stock, image_url, images, is_active, size, weight)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                finalId, // Use finalId
                product.name,
                product.description,
                product.price,
                product.category,
                totalStock,
                product.imageUrl,
                JSON.stringify(product.images || []),
                product.isActive,
                product.size,
                product.weight || 750
            ]);
        }

        // Handle Sizes
        if (product.sizes) {
            // Delete existing sizes to replace with new set
            await client.query('DELETE FROM product_sizes WHERE product_id = $1', [finalId]);

            // Insert new sizes
            for (const s of product.sizes) {
                const sizeId = crypto.randomUUID();
                await client.query(`
                    INSERT INTO product_sizes (id, product_id, size, stock)
                    VALUES ($1, $2, $3, $4)
                `, [sizeId, finalId, s.size, s.stock]); // Use finalId
            }
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function deleteProduct(id: string) {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
}

export async function toggleProductStatus(id: string) {
    const product = await getProduct(id);
    if (product) {
        await pool.query('UPDATE products SET is_active = $1 WHERE id = $2', [
            !product.isActive,
            id
        ]);
    }
}

export async function updateOrderStatus(orderId: string, status: string, logisticsId?: string, courierName?: string) {
    if (logisticsId) {
        await pool.query('UPDATE orders SET status = $1, logistics_id = $2, courier_name = $3 WHERE id = $4', [status, logisticsId, courierName, orderId]);
    } else {
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
    }
}

export async function deleteOrder(id: string) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
        await client.query('DELETE FROM orders WHERE id = $1', [id]);
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function updateOrder(id: string, details: { customerName: string, customerEmail: string, customerMobile: string, shippingAddress: any }) {
    await pool.query(`
        UPDATE orders 
        SET customer_name = $1, customer_email = $2, customer_mobile = $3, shipping_address = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
    `, [
        details.customerName,
        details.customerEmail,
        details.customerMobile,
        JSON.stringify(details.shippingAddress),
        id
    ]);
}

export async function getDiscounts(): Promise<Discount[]> {
    const res = await pool.query('SELECT * FROM discounts ORDER BY created_at DESC');
    return res.rows.map(row => ({
        ...row,
        price: parseFloat(row.price)
    })) as Discount[];
}

export async function createDiscount(discount: Omit<Discount, 'id' | 'active' | 'createdAt'>) {
    const id = crypto.randomUUID();
    await pool.query(
        'INSERT INTO discounts (id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [id, (discount as any).productId, discount.quantity, discount.price]
    );
}

export async function deleteDiscount(id: string) {
    await pool.query('DELETE FROM discounts WHERE id = $1', [id]);
}

export async function getOrderById(id: string): Promise<Order | null> {
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    const order = orderRes.rows[0];
    if (!order) return null;

    const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    const items = itemsRes.rows;

    return {
        id: order.id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerMobile: order.customer_mobile,
        shippingAddress: typeof order.shipping_address === 'string'
            ? JSON.parse(order.shipping_address)
            : order.shipping_address,
        totalAmount: parseFloat(order.total_amount),
        shippingCost: parseFloat(order.shipping_cost),
        status: order.status,
        transactionId: order.transaction_id,
        cashfreeOrderId: order.cashfree_order_id,
        cashfreePaymentId: order.cashfree_payment_id,
        logisticsId: order.logistics_id,
        courierName: order.courier_name,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: items.map(item => ({
            id: item.id,
            productId: item.product_id,
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price),
            imageUrl: item.image_url,
            size: item.size
        }))
    };
}

export async function verifyAdmin(username: string): Promise<any | null> {
    const res = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    return res.rows[0] || null;
}

export async function updateAdmin(id: string, newUsername: string, newPassword: string) {
    await pool.query('UPDATE admins SET username = $1, password = $2 WHERE id = $3', [newUsername, newPassword, id]);
}

export async function createInitialAdmin() {
    // Only creates if not exists
    const res = await pool.query('SELECT * FROM admins LIMIT 1');
    if (res.rows.length === 0) {
        await pool.query('INSERT INTO admins (id, username, password) VALUES ($1, $2, $3)', [
            'default-admin', 'admin', 'admin123'
        ]);
        console.log("Seeded default admin");
    }
}

export async function getUniqueCategories(): Promise<string[]> {
    const res = await pool.query('SELECT DISTINCT category FROM products WHERE is_active = true AND category IS NOT NULL AND category != \'\' ORDER BY category');
    return res.rows.map(r => r.category);
}

