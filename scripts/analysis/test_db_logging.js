const { getPaginatedProducts } = require('./lib/db');
require('dotenv').config({ path: '.env.local' });

async function testFilter() {
    console.log("Starting test call to getPaginatedProducts...");
    try {
        const result = await getPaginatedProducts({ isOfferDrop: true, limit: 100 });
        console.log("Test call complete.");
        console.log("Returned product count:", result.data.length);
        if (result.data.length > 0) {
            console.log("First product sample:", {
                name: result.data[0].name,
                isOfferDrop: result.data[0].isOfferDrop
            });
        }
    } catch (e) {
        console.error("Test execution error:", e);
    }
}

testFilter();
