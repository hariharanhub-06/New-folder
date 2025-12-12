import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Test 1: Check if table exists and what columns it has
        const tableInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'discounts'
            ORDER BY ordinal_position
        `);

        // Test 2: Try a simple insert
        const testId = crypto.randomUUID();
        let insertResult = null;
        let insertError = null;

        try {
            await pool.query(
                `INSERT INTO discounts (id, discount_type, target_type, category, product_id, quantity, price, percentage, active) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
                [testId, 'bundle', 'category', 'Test', null, 3, 100, null]
            );
            insertResult = 'Insert successful';

            // Clean up test data
            await pool.query('DELETE FROM discounts WHERE id = $1', [testId]);
        } catch (err: any) {
            insertError = {
                message: err.message,
                code: err.code,
                detail: err.detail,
                hint: err.hint
            };
        }

        return NextResponse.json({
            success: true,
            tableColumns: tableInfo.rows,
            insertTest: insertResult,
            insertError: insertError
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code,
            detail: error.detail
        }, { status: 500 });
    }
}
