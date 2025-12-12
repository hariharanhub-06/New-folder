import Razorpay from 'razorpay';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn("Razorpay credentials missing!");
}

// Use a dummy key for build time if actual key is missing. 
// This prevents 'key_id mandatory' error during static generation.
const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_build_placeholder';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';

export const razorpay = new Razorpay({
    key_id,
    key_secret,
});

export interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: any;
    created_at: number;
}
