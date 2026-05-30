
import crypto from 'crypto';
import { Pool } from 'pg';
import { Product, Order, OrderItem, Discount, Customer } from './types';

let pool: Pool;

if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.POSTGRES_PRISMA_URL) {
    // During build time or if env not set, avoid crashing
    console.warn("DATABASE_URL is not set. Database operations will fail.");
    // Mock pool or throw error later
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

// Use global singleton to prevent pool exhaustion (critical for serverless environments)
declare global {
    var postgresPool: Pool | undefined;
}

if (!global.postgresPool) {
    global.postgresPool = new Pool({
        connectionString,
        ssl: true,
        max: 10, // Maintain a stable pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });
}
pool = global.postgresPool;

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
        isOffer: row.is_offer,
        isTrending: row.is_trending,
        isOfferDrop: row.is_offer_drop,
        isNewArrival: row.is_new_arrival,
        size: row.size,
        sizes: sizeRes.rows.map(r => ({ size: r.size, stock: r.stock, id: r.id })), // Map DB rows to Size objects
        weight: row.weight || 750,  // Default to 750 grams if not set
        visibilityTags: row.visibility_tags || [],
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
        includeInactive = false,
        isOffer,
        isTrending,
        isOfferDrop,
        isNewArrival,
        tag
    } = filters;

    const offset = (page - 1) * limit;
    const params: any[] = [];
    // Optimize: Exclude 'images' column (huge JSON) from list view to prevent RSC payload crash
    let query = 'SELECT id, name, description, price, category, stock, image_url, is_active, is_offer, is_trending, is_offer_drop, is_new_arrival, visibility_tags, size, weight, created_at, updated_at FROM products WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM products WHERE 1=1';

    // 1. Build Filters
    if (!includeInactive) {
        query += ' AND is_active = true';
        countQuery += ' AND is_active = true';
    }

    if (category && category !== 'All Categories') {
        params.push(category.toLowerCase());
        query += ` AND LOWER(category) = $${params.length}`;
        countQuery += ` AND LOWER(category) = $${params.length}`;
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

    if (isOffer !== undefined) {
        params.push(isOffer);
        query += ` AND is_offer = $${params.length}`;
        countQuery += ` AND is_offer = $${params.length}`;
    }

    if (isTrending !== undefined) {
        params.push(isTrending);
        query += ` AND is_trending = $${params.length}`;
        countQuery += ` AND is_trending = $${params.length}`;
    }

    if (isOfferDrop !== undefined) {
        params.push(isOfferDrop);
        query += ` AND is_offer_drop = $${params.length}`;
        countQuery += ` AND is_offer_drop = $${params.length}`;
    }

    if (isNewArrival !== undefined) {
        params.push(isNewArrival);
        query += ` AND is_new_arrival = $${params.length}`;
        countQuery += ` AND is_new_arrival = $${params.length}`;
    }

    // 1.5 Visibility Logic
    // Apply tag filter if specifically requested
    if (tag) {
        params.push(tag);
        query += ` AND visibility_tags @> jsonb_build_array($${params.length}::text)`;
        countQuery += ` AND visibility_tags @> jsonb_build_array($${params.length}::text)`;
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
    const [productsRes, countRes] = await Promise.all([
        pool.query(query, params),
        pool.query(countQuery, params)
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
            images: (() => { try { return row.images ? JSON.parse(row.images) : []; } catch { return []; } })(),
            isActive: row.is_active,
            isOffer: row.is_offer,
            isTrending: row.is_trending,
            isOfferDrop: row.is_offer_drop,
            isNewArrival: row.is_new_arrival,
            size: row.size,
            sizes: sizesMap.get(row.id) || [],
            weight: row.weight || 750,  // Default to 750 grams if not set
            visibilityTags: row.visibility_tags || [],
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
                stock = $5, image_url = $6, images = $7, size = $8, is_active = $9, weight = $10, is_offer = $11, is_trending = $12, is_offer_drop = $13, is_new_arrival = $14,
                visibility_tags = $15, updated_at = CURRENT_TIMESTAMP
                WHERE id = $16
            `, [
                product.name,
                product.description,
                product.price,
                product.category,
                totalStock,
                product.imageUrl,
                JSON.stringify(product.images || []),
                product.size,
                product.isActive !== undefined ? product.isActive : true,
                product.weight || 750,
                product.isOffer || false,
                product.isTrending || false,
                product.isOfferDrop || false,
                product.isNewArrival || false,
                JSON.stringify(product.visibilityTags || []),
                finalId
            ]);
        } else {
            await client.query(`
                INSERT INTO products (id, name, description, price, category, stock, image_url, images, is_active, size, weight, is_offer, is_trending, is_offer_drop, is_new_arrival, visibility_tags)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            `, [
                finalId,
                product.name,
                product.description,
                product.price,
                product.category,
                totalStock,
                product.imageUrl,
                JSON.stringify(product.images || []),
                product.isActive !== undefined ? product.isActive : true,
                product.size,
                product.weight || 750,
                product.isOffer || false,
                product.isTrending || false,
                product.isOfferDrop || false,
                product.isNewArrival || false,
                JSON.stringify(product.visibilityTags || [])
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
                    INSERT INTO product_sizes(id, product_id, size, stock)
            VALUES($1, $2, $3, $4)
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
    const res = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return res.rowCount > 0;
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
        customerId: order.customer_id,
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
        razorpayOrderId: order.razorpay_order_id,
        razorpayPaymentId: order.razorpay_payment_id,
        cashfreeOrderId: order.cashfree_order_id,
        cashfreePaymentId: order.cashfree_payment_id,
        logisticsId: order.logistics_id,
        courierName: order.courier_name,
        dropReason: order.drop_reason,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: items.map((item: any): OrderItem => ({
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
    const res = await pool.query(`
        SELECT name FROM categories 
        ORDER BY 
            COALESCE(display_order, 999) ASC,
            LOWER(name) ASC
    `);
    return res.rows.map(r => r.name);
}

// Full category management
export async function getFullCategories() {
    const res = await pool.query(`
        SELECT c.*, COUNT(p.id)::int as product_count
        FROM categories c
        LEFT JOIN products p ON LOWER(c.name) = LOWER(p.category) AND p.is_active = true
        GROUP BY c.id
        ORDER BY 
            COALESCE(c.display_order, 999) ASC,
            LOWER(c.name) ASC,
            c.created_at ASC
    `);
    return res.rows;
}

export async function upsertCategory(category: { id?: string, name: string, image_url?: string, display_order?: number, is_active?: boolean, title?: string }) {
    const safeName = category.name.trim();
    // Default ID generation
    let id = category.id || safeName.toLowerCase().replace(/\s+/g, '-');

    // Check if name already exists to avoid unique constraint violation on 'name'
    // If it exists, we MUST use that ID to trigger the ON CONFLICT(id) clause
    const existing = await pool.query('SELECT id FROM categories WHERE lower(name) = lower($1)', [safeName]);
    if (existing.rows.length > 0) {
        id = existing.rows[0].id;
    }

    await pool.query(`
        INSERT INTO categories(id, name, image_url, display_order, is_active, title)
            VALUES($1, $2, $3, $4, $5, $6)
        ON CONFLICT(id) DO UPDATE SET
            name = EXCLUDED.name,
            image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
            display_order = COALESCE(EXCLUDED.display_order, categories.display_order),
            is_active = EXCLUDED.is_active,
            title = COALESCE(EXCLUDED.title, categories.title)
                    `, [id, safeName, category.image_url || null, category.display_order || 0, category.is_active !== undefined ? category.is_active : true, category.title || null]);
    return { success: true, id };
}

export async function deleteCategory(id: string) {
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return { success: true };
}

// Site Settings
export async function getSiteSettings() {
    const res = await pool.query('SELECT * FROM site_settings');
    const settings: Record<string, string> = {};
    res.rows.forEach(r => settings[r.key] = r.value);
    return settings;
}

export async function updateSiteSetting(key: string, value: string) {
    await pool.query(`
        INSERT INTO site_settings(key, value)
            VALUES($1, $2)
        ON CONFLICT(key) DO UPDATE SET
            value = EXCLUDED.value,
                updated_at = CURRENT_TIMESTAMP
                    `, [key, value]);
    return { success: true };
}

export async function toggleProductOffer(id: string) {
    const product = await getProduct(id);
    if (product) {
        await pool.query('UPDATE products SET is_offer = $1 WHERE id = $2', [
            !product.isOffer,
            id
        ]);
        return { success: true };
    }
    return { success: false };
}


export async function toggleProductTrending(id: string) {
    const product = await getProduct(id);
    if (product) {
        await pool.query('UPDATE products SET is_trending = $1 WHERE id = $2', [
            !product.isTrending,
            id
        ]);
        return { success: true };
    }
    return { success: false };
}

export async function toggleProductOfferDrop(id: string) {
    const product = await getProduct(id);
    if (product) {
        await pool.query('UPDATE products SET is_offer_drop = $1 WHERE id = $2', [
            !product.isOfferDrop,
            id
        ]);
        return { success: true };
    }
    return { success: false };
}

// --- REGISTRATION RATE LIMITING ---

export async function countRecentRegistrations(ip: string): Promise<number> {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS registration_attempts (
            id SERIAL PRIMARY KEY,
            ip TEXT NOT NULL,
            attempted_at TIMESTAMPTZ DEFAULT NOW()
        )
    `);
    const res = await pool.query(
        `SELECT COUNT(*) FROM registration_attempts WHERE ip = $1 AND attempted_at > NOW() - INTERVAL '24 hours'`,
        [ip]
    );
    return parseInt(res.rows[0].count, 10);
}

export async function logRegistrationAttempt(ip: string): Promise<void> {
    await pool.query(
        `INSERT INTO registration_attempts (ip) VALUES ($1)`,
        [ip]
    );
}

export async function hasEverRegistered(ip: string): Promise<boolean> {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS registration_attempts (
            id SERIAL PRIMARY KEY,
            ip TEXT NOT NULL,
            attempted_at TIMESTAMPTZ DEFAULT NOW()
        )
    `);
    const res = await pool.query(
        `SELECT 1 FROM registration_attempts WHERE ip = $1 LIMIT 1`,
        [ip]
    );
    return res.rows.length > 0;
}

// --- CUSTOMER FUNCTIONS ---

export async function createCustomer(data: {
    id: string;
    name: string;
    mobile: string;
    email: string;
    passwordHash: string;
}): Promise<void> {
    await pool.query(`
        INSERT INTO customers (id, name, mobile, email, password_hash, is_verified)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (mobile) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            password_hash = EXCLUDED.password_hash,
            is_verified = true,
            otp_code = NULL,
            otp_expires_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE customers.is_verified = false
    `, [data.id, data.name, data.mobile, data.email, data.passwordHash]);
}

export async function getCustomerByMobile(mobile: string): Promise<any | null> {
    const res = await pool.query('SELECT * FROM customers WHERE mobile = $1', [mobile]);
    return res.rows[0] || null;
}

export async function getCustomerByEmail(email: string): Promise<any | null> {
    const res = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
    return res.rows[0] || null;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
    const res = await pool.query('SELECT id, name, mobile, email, is_verified, created_at FROM customers WHERE id = $1', [id]);
    const row = res.rows[0];
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        mobile: row.mobile,
        email: row.email,
        isVerified: row.is_verified,
        createdAt: row.created_at,
    };
}

export async function verifyCustomerOtp(mobile: string, otp: string): Promise<boolean> {
    const res = await pool.query(`
        UPDATE customers
        SET is_verified = true, otp_code = NULL, otp_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE mobile = $1
          AND otp_code = $2
          AND otp_expires_at > NOW()
          AND is_verified = false
    `, [mobile, otp]);
    return (res.rowCount ?? 0) > 0;
}

export async function setCustomerOtp(mobile: string, otpCode: string, expiresAt: Date): Promise<void> {
    await pool.query(`
        UPDATE customers SET otp_code = $1, otp_expires_at = $2, updated_at = CURRENT_TIMESTAMP
        WHERE mobile = $3
    `, [otpCode, expiresAt, mobile]);
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
    const ordersRes = await pool.query(`
        SELECT o.*,
               COALESCE(json_agg(
                   json_build_object(
                       'id', oi.id,
                       'productId', oi.product_id,
                       'name', oi.name,
                       'quantity', oi.quantity,
                       'price', oi.price,
                       'size', oi.size,
                       'imageUrl', oi.image_url
                   )
               ) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.customer_id = $1
          AND o.status != 'Pending Payment'
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `, [customerId]);

    return ordersRes.rows.map(order => ({
        id: order.id,
        customerId: order.customer_id,
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
        razorpayOrderId: order.razorpay_order_id,
        razorpayPaymentId: order.razorpay_payment_id,
        logisticsId: order.logistics_id,
        courierName: order.courier_name,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: order.items || [],
    }));
}

export async function getAllCustomers(): Promise<(Customer & { orderCount: number; totalSpent: number })[]> {
    const res = await pool.query(`
        SELECT c.id, c.name, c.mobile, c.email, c.is_verified, c.created_at,
               COUNT(o.id)::int as order_count,
               COALESCE(SUM(o.total_amount), 0)::numeric as total_spent
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id AND o.status NOT IN ('Pending Payment', 'Cancelled')
        GROUP BY c.id
        ORDER BY c.created_at DESC
    `);
    return res.rows.map(row => ({
        id: row.id,
        name: row.name,
        mobile: row.mobile,
        email: row.email,
        isVerified: row.is_verified,
        createdAt: row.created_at,
        orderCount: row.order_count,
        totalSpent: parseFloat(row.total_spent),
    }));
}

export async function getCustomerWithOrders(customerId: string): Promise<{ customer: Customer; orders: Order[] } | null> {
    const customer = await getCustomerById(customerId);
    if (!customer) return null;
    const orders = await getCustomerOrders(customerId);
    return { customer, orders };
}

// --- ADDRESS FUNCTIONS ---

export async function getCustomerAddresses(customerId: string) {
    const res = await pool.query(
        'SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC',
        [customerId]
    );
    return res.rows;
}

export async function addCustomerAddress(data: {
    id: string; customerId: string; label: string; name: string; mobile: string;
    street: string; city: string; state: string; country: string; pincode: string; isDefault: boolean;
}) {
    if (data.isDefault) {
        await pool.query('UPDATE customer_addresses SET is_default = false WHERE customer_id = $1', [data.customerId]);
    }
    await pool.query(
        `INSERT INTO customer_addresses (id, customer_id, label, name, mobile, street, city, state, country, pincode, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [data.id, data.customerId, data.label, data.name, data.mobile, data.street, data.city, data.state, data.country, data.pincode, data.isDefault]
    );
}

export async function updateCustomerAddress(id: string, customerId: string, data: {
    label?: string; name?: string; mobile?: string; street?: string;
    city?: string; state?: string; country?: string; pincode?: string; isDefault?: boolean;
}) {
    if (data.isDefault) {
        await pool.query('UPDATE customer_addresses SET is_default = false WHERE customer_id = $1', [customerId]);
    }
    await pool.query(
        `UPDATE customer_addresses SET
            label = COALESCE($1, label), name = COALESCE($2, name), mobile = COALESCE($3, mobile),
            street = COALESCE($4, street), city = COALESCE($5, city), state = COALESCE($6, state),
            country = COALESCE($7, country), pincode = COALESCE($8, pincode),
            is_default = COALESCE($9, is_default)
         WHERE id = $10 AND customer_id = $11`,
        [data.label, data.name, data.mobile, data.street, data.city, data.state, data.country, data.pincode, data.isDefault, id, customerId]
    );
}

export async function deleteCustomerAddress(id: string, customerId: string) {
    await pool.query('DELETE FROM customer_addresses WHERE id = $1 AND customer_id = $2', [id, customerId]);
}

export async function setDefaultAddress(id: string, customerId: string) {
    await pool.query('UPDATE customer_addresses SET is_default = false WHERE customer_id = $1', [customerId]);
    await pool.query('UPDATE customer_addresses SET is_default = true WHERE id = $1 AND customer_id = $2', [id, customerId]);
}
