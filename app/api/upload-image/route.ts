import { NextResponse } from 'next/server';
import { imagekitSecondary, imagekitPrimary } from '@/lib/imagekit';
import pool from '@/lib/db';

// ── Round-robin across the two ImageKit accounts ─────────────────────────────
// Instead of "fill account A, then fall back to B", every upload alternates
// A → B → A → B … so both accounts fill evenly / get used in parallel.
//
// The counter lives in Postgres (not memory) so it keeps alternating across
// serverless cold starts and multiple instances. If the counter is ever
// unavailable we fall back to a random pick, and if the chosen account errors
// we fall back to the other one — so balancing never blocks an upload.

let counterReady = false;
async function ensureCounter() {
    if (counterReady) return;
    await pool.query(
        `CREATE TABLE IF NOT EXISTS upload_rr_counter (id INT PRIMARY KEY, value BIGINT NOT NULL DEFAULT 0)`
    );
    await pool.query(
        `INSERT INTO upload_rr_counter (id, value) VALUES (1, 0) ON CONFLICT (id) DO NOTHING`
    );
    counterReady = true;
}

// Atomically increments the shared counter and returns 0 or 1 (alternating).
async function nextAccountIndex(): Promise<number> {
    await ensureCounter();
    const res = await pool.query(
        `UPDATE upload_rr_counter SET value = value + 1 WHERE id = 1 RETURNING value`
    );
    return Number(res.rows[0]?.value ?? 0) % 2;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '');

        // Pick which account goes first this time (alternates every upload).
        let idx: number;
        try {
            idx = await nextAccountIndex();
        } catch (counterErr: any) {
            console.warn('[UPLOAD] round-robin counter unavailable, using random pick:', counterErr?.message);
            idx = Math.round(Math.random());
        }

        const order = idx === 0
            ? [{ ik: imagekitPrimary, name: 'primary' }, { ik: imagekitSecondary, name: 'secondary' }]
            : [{ ik: imagekitSecondary, name: 'secondary' }, { ik: imagekitPrimary, name: 'primary' }];

        let result;
        try {
            result = await order[0].ik.upload({ file: buffer, fileName: filename, folder: '/products' });
            console.log(`[UPLOAD] round-robin → ${order[0].name} ImageKit account`);
        } catch (firstError: any) {
            console.warn(`[UPLOAD] ${order[0].name} failed, falling back to ${order[1].name}:`, firstError?.message);
            result = await order[1].ik.upload({ file: buffer, fileName: filename, folder: '/products' });
            console.log(`[UPLOAD] round-robin fallback → ${order[1].name} ImageKit account`);
        }

        return NextResponse.json({ success: true, url: result.url, publicId: result.fileId });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
