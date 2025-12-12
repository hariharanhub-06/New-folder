
import { Pool } from 'pg';
import { Product, Order, Discount } from './types';

let pool: Pool;

if (!process.env.DATABASE_URL) {
    // During build time or if env not set, avoid crashing
    console.warn("DATABASE_URL is not set. Database operations will fail.");
    // Mock pool or throw error later
}

const connectionString = process.env.DATABASE_URL;

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

    return {
        id: row.id,
        name: row.name,
        description: row.description,
        price: parseFloat(row.price),
        category: row.category,
        stock: row.stock,
        imageUrl: row.image_url,
        images: row.images ? JSON.parse(row.images) : [],
        isActive: row.is_active,
        size: row.size,
        sizes: sizeRes.rows.map(r => ({ size: r.size, stock: r.stock, id: r.id })), // Map DB rows to Size objects
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function saveProduct(product: Product) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const res = await client.query('SELECT id FROM products WHERE id = $1', [product.id]);
        const exists = res.rows[0];
        // Calculate total stock if not provided or just sync it
        const totalStock = product.sizes ? product.sizes.reduce((acc, s) => acc + s.stock, 0) : product.stock;

        if (exists) {
            // Update Product
            await client.query(`
                UPDATE products 
                SET name = $1, description = $2, price = $3, category = $4, 
                    stock = $5, image_url = $6, images = $7, size = $8, is_active = $9, updated_at = CURRENT_TIMESTAMP
                WHERE id = $10
            `, [
                product.name,
                product.description,
                product.price,
                product.category,
                totalStock, // Sync total stock
                product.imageUrl,
                JSON.stringify(product.images || []),
                product.size,
                product.isActive,
                product.id
            ]);
        } else {
            // Insert Product
            const id = product.id || crypto.randomUUID();
            await client.query(`
                INSERT INTO products (id, name, description, price, category, stock, image_url, images, is_active, size)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                id,
                product.name,
                product.description,
                product.price,
                product.category,
                totalStock, // Sync total stock
                product.imageUrl,
                JSON.stringify(product.images || []),
                product.isActive,
                product.size
            ]);
        }

        // Handle Sizes
        if (product.sizes) {
            // Delete existing sizes to replace with new set (easiest way to handle updates/deletes)
            await client.query('DELETE FROM product_sizes WHERE product_id = $1', [product.id]);

            // Insert new sizes
            for (const s of product.sizes) {
                const sizeId = crypto.randomUUID();
                await client.query(`
                    INSERT INTO product_sizes (id, product_id, size, stock)
                    VALUES ($1, $2, $3, $4)
                `, [sizeId, product.id, s.size, s.stock]);
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
        'INSERT INTO discounts (id, category, quantity, price) VALUES ($1, $2, $3, $4)',
        [id, discount.category, discount.quantity, discount.price]
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
            productId: item.product_id,
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price)
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

