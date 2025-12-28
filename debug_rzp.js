
const Razorpay = require('razorpay');

const RZP_KEY_ID = "qsh62OwLqHVcgL4jp2awKECr";
const RZP_KEY_SECRET = "Ampu@3119";

const razorpay = new Razorpay({
    key_id: RZP_KEY_ID,
    key_secret: RZP_KEY_SECRET,
});

async function run() {
    try {
        console.log("Attempting to list recent payments...");
        const payments = await razorpay.payments.all({ count: 5 });
        console.log("SUCCESS! Found payments:");
        payments.items.forEach(p => {
            console.log(`- ${p.email} | ${p.contact} | ${p.status} | Order: ${p.order_id}`);
        });
    } catch (err) {
        console.error("DEBUG ERROR:");
        console.error(JSON.stringify(err, null, 2));
        console.error("Message:", err.message);
    }
}

run();
