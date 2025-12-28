// Comprehensive System Integration Check
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkIntegrations() {
    const client = await pool.connect();
    const issues = [];
    const warnings = [];

    try {
        console.log('\n🔍 COMPREHENSIVE SYSTEM CHECK\n');
        console.log('='.repeat(60));

        // 1. Check Environment Variables
        console.log('\n1️⃣  Checking Environment Variables...');
        const requiredEnvVars = [
            'POSTGRES_URL',
            'RAZORPAY_KEY_ID',
            'RAZORPAY_KEY_SECRET',
            'RAZORPAY_WEBHOOK_SECRET',
            'EMAIL_USER',
            'EMAIL_PASSWORD'
        ];

        requiredEnvVars.forEach(varName => {
            if (!process.env[varName]) {
                issues.push(`❌ Missing environment variable: ${varName}`);
            } else {
                console.log(`   ✅ ${varName}: Set`);
            }
        });

        // 2. Check Database Tables
        console.log('\n2️⃣  Checking Database Tables...');
        const tables = ['products', 'categories', 'orders', 'order_items', 'product_sizes'];

        for (const table of tables) {
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = $1
                )
            `, [table]);

            if (result.rows[0].exists) {
                console.log(`   ✅ Table '${table}' exists`);
            } else {
                issues.push(`❌ Missing table: ${table}`);
            }
        }

        // 3. Check for Orphaned Data
        console.log('\n3️⃣  Checking for Orphaned Data...');

        // Order items without orders
        const orphanedItems = await client.query(`
            SELECT COUNT(*) as count
            FROM order_items oi
            LEFT JOIN orders o ON o.id = oi.order_id
            WHERE o.id IS NULL
        `);

        if (parseInt(orphanedItems.rows[0].count) > 0) {
            issues.push(`❌ Found ${orphanedItems.rows[0].count} orphaned order items`);
        } else {
            console.log('   ✅ No orphaned order items');
        }

        // Product sizes without products
        const orphanedSizes = await client.query(`
            SELECT COUNT(*) as count
            FROM product_sizes ps
            LEFT JOIN products p ON p.id = ps.product_id
            WHERE p.id IS NULL
        `);

        if (parseInt(orphanedSizes.rows[0].count) > 0) {
            warnings.push(`⚠️  Found ${orphanedSizes.rows[0].count} orphaned product sizes`);
        } else {
            console.log('   ✅ No orphaned product sizes');
        }

        // 4. Check Shadow Order Issues
        console.log('\n4️⃣  Checking Shadow Orders...');

        // Old pending payments (> 1 hour)
        const oldPending = await client.query(`
            SELECT COUNT(*) as count
            FROM orders
            WHERE status = 'Pending Payment'
            AND created_at < NOW() - INTERVAL '1 hour'
        `);

        if (parseInt(oldPending.rows[0].count) > 0) {
            warnings.push(`⚠️  Found ${oldPending.rows[0].count} old pending payments (> 1 hour)`);
        } else {
            console.log('   ✅ No stale pending payments');
        }

        // Orders without items
        const ordersWithoutItems = await client.query(`
            SELECT COUNT(*) as count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE oi.id IS NULL
            AND o.status != 'Pending Payment'
        `);

        if (parseInt(ordersWithoutItems.rows[0].count) > 0) {
            issues.push(`❌ Found ${ordersWithoutItems.rows[0].count} confirmed orders without items`);
        } else {
            console.log('   ✅ All confirmed orders have items');
        }

        // 5. Check Order Items Data Integrity
        console.log('\n5️⃣  Checking Order Items Data Integrity...');

        const itemsMissingName = await client.query(`
            SELECT COUNT(*) as count
            FROM order_items
            WHERE name IS NULL OR name = ''
        `);

        if (parseInt(itemsMissingName.rows[0].count) > 0) {
            issues.push(`❌ Found ${itemsMissingName.rows[0].count} order items missing name`);
        } else {
            console.log('   ✅ All order items have names');
        }

        // 6. Check Stock Consistency
        console.log('\n6️⃣  Checking Stock Consistency...');

        const negativeStock = await client.query(`
            SELECT id, name, stock
            FROM products
            WHERE stock < 0
        `);

        if (negativeStock.rows.length > 0) {
            issues.push(`❌ Found ${negativeStock.rows.length} products with negative stock`);
            negativeStock.rows.forEach(p => {
                console.log(`      Product: ${p.name} (Stock: ${p.stock})`);
            });
        } else {
            console.log('   ✅ No negative stock found');
        }

        // 7. Check Category Duplicates
        console.log('\n7️⃣  Checking for Category Duplicates...');

        const duplicateCats = await client.query(`
            SELECT LOWER(TRIM(name)) as normalized, COUNT(*) as count
            FROM categories
            GROUP BY LOWER(TRIM(name))
            HAVING COUNT(*) > 1
        `);

        if (duplicateCats.rows.length > 0) {
            warnings.push(`⚠️  Found ${duplicateCats.rows.length} duplicate category names`);
            duplicateCats.rows.forEach(c => {
                console.log(`      "${c.normalized}" (${c.count} entries)`);
            });
        } else {
            console.log('   ✅ No duplicate categories');
        }

        // 8. Check Products Without Categories
        console.log('\n8️⃣  Checking Products Without Categories...');

        const noCategoryProducts = await client.query(`
            SELECT COUNT(*) as count
            FROM products
            WHERE category IS NULL OR category = ''
        `);

        if (parseInt(noCategoryProducts.rows[0].count) > 0) {
            warnings.push(`⚠️  Found ${noCategoryProducts.rows[0].count} products without category`);
        } else {
            console.log('   ✅ All products have categories');
        }

        // 9. Check Razorpay Integration
        console.log('\n9️⃣  Checking Razorpay Integration...');

        const ordersWithoutRazorpayId = await client.query(`
            SELECT COUNT(*) as count
            FROM orders
            WHERE status = 'Payment Confirmed'
            AND (razorpay_order_id IS NULL OR razorpay_order_id = '')
        `);

        if (parseInt(ordersWithoutRazorpayId.rows[0].count) > 0) {
            issues.push(`❌ Found ${ordersWithoutRazorpayId.rows[0].count} confirmed orders without Razorpay ID`);
        } else {
            console.log('   ✅ All confirmed orders have Razorpay IDs');
        }

        // 10. Summary
        console.log('\n' + '='.repeat(60));
        console.log('\n📊 SUMMARY:\n');

        if (issues.length === 0 && warnings.length === 0) {
            console.log('✅ ✅ ✅  ALL CHECKS PASSED! System is healthy.\n');
        } else {
            if (issues.length > 0) {
                console.log(`🔴 CRITICAL ISSUES (${issues.length}):`);
                issues.forEach(issue => console.log(`   ${issue}`));
                console.log('');
            }

            if (warnings.length > 0) {
                console.log(`🟡 WARNINGS (${warnings.length}):`);
                warnings.forEach(warning => console.log(`   ${warning}`));
                console.log('');
            }
        }

        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('\n❌ ERROR during check:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkIntegrations();
