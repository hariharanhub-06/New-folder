
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestProduct() {
    try {
        const product = await prisma.product.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (!product) {
            console.log("No products found.");
            return;
        }

        console.log("Latest Product:", product.name);
        console.log("Image URL:", product.imageUrl);
        console.log("All Images:", product.images);

        // Check if URL contains the old or new endpoint ID
        const oldId = "lzmpw"; // derived from previous context
        const newId = "6k5vfwl1j"; // derived from previous context

        if (product.imageUrl.includes(oldId)) {
            console.log("WARNING: Product is using the OLD ImageKit ID (lzmpw)");
        } else if (product.imageUrl.includes(newId)) {
            console.log("SUCCESS: Product is using the NEW ImageKit ID (6k5vfwl1j)");
        } else {
            console.log("INFO: Product is using an unknown ImageKit ID or external URL");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkLatestProduct();
