import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
    console.error('❌ No database connection string found');
    console.error('Make sure DATABASE_URL is set in your environment or .env.local file');
    process.exit(1);
}

const pool = new Pool({ connectionString, ssl: true });


async function addWeightColumn() {
    try {
        console.log('🔄 Adding weight column to products table...');

        // Add weight column (in grams, default 750g = 0.75kg)
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 750
        `);

        console.log('✅ Weight column added successfully');
        console.log('   - Column: weight (INTEGER)');
        console.log('   - Default: 750 grams (0.75 kg)');
        console.log('   - All existing products now have 750g weight');

        // Verify the column was added
        const result = await pool.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'products' AND column_name = 'weight'
        `);

        if (result.rows.length > 0) {
            console.log('\n✅ Verification successful:');
            console.log(`   Column: ${result.rows[0].column_name}`);
            console.log(`   Type: ${result.rows[0].data_type}`);
            console.log(`   Default: ${result.rows[0].column_default}`);
        }

        pool.end();
    } catch (error) {
        console.error('❌ Error adding weight column:', error);
        pool.end();
        process.exit(1);
    }
}

addWeightColumn();
