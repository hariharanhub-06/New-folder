import { NextResponse } from 'next/server';
import { imagekitSecondary, imagekitPrimary } from '@/lib/imagekit';

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

        let result;
        try {
            result = await imagekitSecondary.upload({ file: buffer, fileName: filename, folder: '/products' });
            console.log('[UPLOAD] Used secondary ImageKit account');
        } catch (secondaryError: any) {
            console.warn('[UPLOAD] Secondary ImageKit failed, trying primary:', secondaryError?.message);
            result = await imagekitPrimary.upload({ file: buffer, fileName: filename, folder: '/products' });
            console.log('[UPLOAD] Used primary ImageKit account (secondary fallback)');
        }

        return NextResponse.json({ success: true, url: result.url, publicId: result.fileId });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
