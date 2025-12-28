// Quick Bug Check - Critical Issues Only
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function quickCheck() {
    const client = await pool.connect();
    const bugs = [];

    try {
        // 1. Order items missing name (CRITICAL BUG)
        const missingNames = await client.query(`
            SELECT o.id as order_id, oi.product_id, o.status
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.name IS NULL OR oi.name = ''
        `);

        if (missingNames.rows.length > 0) {
            bugs.push({
                severity: 'CRITICAL',
                issue: `${missingNames.rows.length} order items have NULL name`,
                impact: 'Orders will fail to display properly',
                fix: 'Run: UPDATE order_items SET name = (SELECT name FROM products WHERE id = order_items.product_id) WHERE name IS NULL'
            });
        }

        // 2. Negative stock
        const negStock = await client.query(`SELECT id, name, stock FROM products WHERE stock < 0`);
        if (negStock.rows.length > 0) {
            bugs.push({
                severity: 'HIGH',
                issue: `${negStock.rows.length} products have negative stock`,
                products: negStock.rows.map(p => `${p.name}: ${p.stock}`),
                impact: 'Overselling occurred',
                fix: 'Review stock and adjust manually'
            });
        }

        // 3. Orphaned order items
        const orphaned = await client.query(`
            SELECT COUNT(*) as count
            FROM order_items oi
            LEFT JOIN orders o ON o.id = oi.order_id
            WHERE o.id IS NULL
        `);
        if (parseInt(orphaned.rows[0].count) > 0) {
            bugs.push({
                severity: 'MEDIUM',
                issue: `${orphaned.rows[0].count} orphaned order items`,
                impact: 'Database clutter',
                fix: `DELETE FROM order_items WHERE order_id NOT IN (SELECT id FROM orders)`
            });
        }

        // 4. Confirmed orders without Razorpay ID
        const noRazorpay = await client.query(`
            SELECT id, customer_name, total_amount
            FROM orders
            WHERE status = 'Payment Confirmed'
            AND (razorpay_order_id IS NULL OR razorpay_order_id = '')
        `);
        if (noRazorpay.rows.length > 0) {
            bugs.push({
                severity: 'HIGH',
                issue: `${noRazorpay.rows.length} confirmed orders missing Razorpay ID`,
                orders: noRazorpay.rows.map(o => `${o.customer_name}: ₹${o.total_amount}`),
                impact: 'Cannot verify payment legitimacy',
                fix: 'Manually verify these orders in Razorpay dashboard'
            });
        }

        // 5. Old pending payments (stuck)
        const stuckPending = await client.query(`
            SELECT id, customer_name, created_at
            FROM orders
            WHERE status = 'Pending Payment'
            AND created_at < NOW() - INTERVAL '2 hours'
        `);
        if (stuckPending.rows.length > 0) {
            bugs.push({
                severity: 'LOW',
                issue: `${stuckPending.rows.length} stuck pending payments (>2 hours old)`,
                impact: 'Database clutter, reserved stock not released',
                fix: 'These likely abandoned - safe to mark as "Payment Failed"'
            });
        }

        // Output
        const report = {
            timestamp: new Date().toISOString(),
            totalBugs: bugs.length,
            bugs: bugs
        };

        console.log(JSON.stringify(report, null, 2));
        fs.writeFileSync('bug-report.json', JSON.stringify(report, null, 2));

    } catch (error) {
        console.error(JSON.stringify({ error: error.message }));
    } finally {
        client.release();
        await pool.end();
    }
}

quickCheck();
