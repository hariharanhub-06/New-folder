const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');

try {
    let content = fs.readFileSync(envPath);

    // Try to detect if it's UTF-16LE (BOM is FF FE)
    let text = '';
    if (content[0] === 0xFF && content[1] === 0xFE) {
        console.log("Detected UTF-16LE BOM");
        text = content.toString('utf16le');
    } else {
        // Assume UTF-8 or mixed which usually reads okay as UTF-8 ignoring garbage
        text = content.toString('utf8');
    }

    // Split lines and clean up
    const lines = text.split(/\r?\n/);
    const cleanLines = [];
    const keysFound = new Set();

    // Specific keys we want to ensure have specific values (New DB, ImageKit)
    const overrides = {
        'DATABASE_URL': 'postgresql://neondb_owner:npg_3hgCudc2TDEv@ep-spring-star-ahc1v027-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
        'POSTGRES_URL': 'postgresql://neondb_owner:npg_3hgCudc2TDEv@ep-spring-star-ahc1v027-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
        'NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY': 'public_AZ/4UeijA4/8Ow3OV7m7NCU94tk=',
        'IMAGEKIT_PRIVATE_KEY': 'private_qMaXWBjj/6/s2a7eN2p/1yOKLK8=',
        'NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT': 'https://ik.imagekit.io/lzmpwlx08'
    };

    // Process existing lines to recover OTHER keys
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;

        // Clean up null bytes or weird artifacts
        line = line.replace(/\0/g, '');

        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();

            // Remove quotes if present to normalize
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            if (!overrides[key] && !keysFound.has(key)) {
                // Keep this existing key (e.g., RAZORPAY, GOOGLE_SCRIPT)
                cleanLines.push(`${key}="${value}"`);
                keysFound.add(key);
            }
        }
    }

    // Add/Update our mandatory keys
    for (const [key, value] of Object.entries(overrides)) {
        cleanLines.push(`${key}="${value}"`);
    }

    const newContent = cleanLines.join('\n');
    fs.writeFileSync(envPath, newContent, 'utf8');
    console.log("Successfully repaired .env.local");
    console.log("Current Keys:", cleanLines.map(l => l.split('=')[0]));

} catch (e) {
    console.error("Failed to repair .env.local:", e);
}
