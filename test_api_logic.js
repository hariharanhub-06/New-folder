const { getPaginatedProducts } = require('./lib/db');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const [key, ...vParts] = line.split('=');
        if (key && vParts.length > 0) {
            process.env[key.trim()] = vParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

loadEnv();

async function testApiLogic() {
    try {
        console.log('--- MIMICKING API CALL FOR tag=formal-shirts ---');
        const filters = {
            page: 1,
            limit: 2000,
            tag: 'formal-shirts',
            sort: 'newest'
        };

        // This is what the API route calls
        const result = await getPaginatedProducts(filters);

        console.log(`Total found: ${result.pagination.total}`);
        console.log(`Data length: ${result.data.length}`);

        console.log('\n--- SAMPLE RESULTS ---');
        result.data.slice(0, 10).forEach(p => {
            console.log(`- ${p.name} (Tags: ${JSON.stringify(p.visibilityTags)})`);
        });

        if (result.data.length > 1) {
            console.log('\nERROR: Found more than 1 product! The filter is failing.');
        } else if (result.data.length === 1) {
            console.log('\nSUCCESS: Only 1 product found. Filter is working.');
        } else {
            console.log('\nNOT FOUND: No products found.');
        }

    } catch (e) {
        console.error(e);
    }
}

testApiLogic();
