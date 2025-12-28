const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Robust env loading
const envPath = fs.existsSync('.env.local') ? '.env.local' : path.join(__dirname, '../.env.local');
require('dotenv').config({ path: envPath });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function getBackupMobiles() {
    try {
        console.log("🔍 Scanning for Pending Payments...");

        // 1. Get all pending payments (missing mobile)
        const pendingRes = await pool.query(`
            SELECT id, customer_name, customer_email, total_amount, created_at, razorpay_order_id
            FROM orders 
            WHERE status = 'Pending Payment' 
            AND (customer_mobile IS NULL OR customer_mobile = '')
            ORDER BY created_at DESC
        `);

        if (pendingRes.rows.length === 0) {
            console.log("✅ No pending payments with missing mobile numbers found.");
            return;
        }

        console.log(`Found ${pendingRes.rows.length} pending orders with missing mobile numbers.\n`);
        console.log("----------------------------------------------------------------");

        let foundCount = 0;

        for (const order of pendingRes.rows) {
            // Normalize search terms
            const email = order.customer_email ? order.customer_email.trim() : null;
            const name = order.customer_name ? order.customer_name.trim() : null;

            let backupMobile = null;
            let source = null;

            // 2. Search by Email (High Confidence)
            if (email) {
                const emailRes = await pool.query(`
                    SELECT customer_mobile, created_at, id 
                    FROM orders 
                    WHERE customer_email = $1 
                    AND customer_mobile IS NOT NULL 
                    AND customer_mobile != ''
                    AND id != $2
                    ORDER BY created_at DESC 
                    LIMIT 1
                `, [email, order.id]);

                if (emailRes.rows.length > 0) {
                    backupMobile = emailRes.rows[0].customer_mobile;
                    source = `Existing Order #${emailRes.rows[0].id} (Email Match)`;
                }
            }

            // 3. Search by Name (Medium Confidence - fallback)
            if (!backupMobile && name) {
                const nameRes = await pool.query(`
                    SELECT customer_mobile, created_at, id 
                    FROM orders 
                    WHERE customer_name ILIKE $1 
                    AND customer_mobile IS NOT NULL 
                    AND customer_mobile != ''
                    AND id != $2
                    ORDER BY created_at DESC 
                    LIMIT 1
                `, [name, order.id]);

                if (nameRes.rows.length > 0) {
                    backupMobile = nameRes.rows[0].customer_mobile;
                    source = `Existing Order #${nameRes.rows[0].id} (Name Match)`;
                }
            }

            // Output result
            if (backupMobile) {
                foundCount++;
                console.log(`✅ FOUND BACKUP INFO for [${order.customer_name}]`);
                console.log(`   Pending Order ID: ${order.id}`);
                console.log(`   Email: ${order.customer_email}`);
                console.log(`   Backup Mobile: ${backupMobile}`);
                console.log(`   Source: ${source}`);
                console.log(`   Razorpay Order ID: ${order.razorpay_order_id || 'N/A'}`);
            } else {
                console.log(`❌ NO MATCH for [${order.customer_name}] (Email: ${order.customer_email || 'N/A'})`);
            }
            console.log("----------------------------------------------------------------");
        }

        console.log(`\nResults: Found mobile numbers for ${foundCount} out of ${pendingRes.rows.length} pending orders.`);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

getBackupMobiles();
