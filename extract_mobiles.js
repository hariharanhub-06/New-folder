
const { Pool } = require('pg');
const Razorpay = require('razorpay');
const fs = require('fs');

// Simple parser for .env.local since we can't 'require' it easily in all environments
function loadEnv() {
    const envPath = '.env.local';
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
    return env;
}

const env = loadEnv();
const connectionString = env.DATABASE_URL || env.POSTGRES_URL || env.POSTGRES_PRISMA_URL;

const razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
});

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
    try {
        console.log("Connecting to database...");
        const res = await pool.query(`
            SELECT customer_name, customer_email, razorpay_order_id 
            FROM orders 
            WHERE status = 'Pending Payment' 
            AND (customer_mobile IS NULL OR customer_mobile = '')
            ORDER BY created_at DESC
        `);

        console.log(`Checking ${res.rows.length} orders...\n`);

        for (const order of res.rows) {
            if (!order.razorpay_order_id) continue;

            try {
                const payments = await razorpay.orders.fetchPayments(order.razorpay_order_id);
                const mobile = payments.items?.[0]?.contact;

                if (mobile) {
                    console.log(`[FOUND] ${order.customer_name}: ${mobile} (${order.customer_email})`);
                } else {
                    console.log(`[NOT FOUND] ${order.customer_name}: No payments found in Razorpay`);
                }
            } catch (err) {
                console.log(`[ERROR] ${order.customer_name}: ${err.message}`);
            }
        }
    } catch (err) {
        console.error("Master Error:", err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

run();
