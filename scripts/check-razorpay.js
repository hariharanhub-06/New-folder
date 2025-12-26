
const Razorpay = require('razorpay');
require('dotenv').config({ path: '.env.local' });

async function checkRazorpay() {
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        console.log("RAZORPAY_KEYS: MISSING");
        return;
    }

    const rzp = new Razorpay({
        key_id,
        key_secret
    });

    try {
        const payments = await rzp.payments.all({ count: 1 });
        console.log("RAZORPAY_AUTH: SUCCESS");
        console.log("RECENT_PAYMENT:", JSON.stringify(payments.items[0], null, 2));
    } catch (e) {
        console.error("RAZORPAY_AUTH: FAILED", e.message);
    }
}

checkRazorpay();
