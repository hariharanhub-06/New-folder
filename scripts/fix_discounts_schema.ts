import pool from '@/lib/db';

async function migrate() {
    try {
        console.log('Starting migration: Making quantity and price nullable in discounts table...');

        await pool.query(`
            ALTER TABLE discounts 
            ALTER COLUMN quantity DROP NOT NULL,
            ALTER COLUMN price DROP NOT NULL;
        `);

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
