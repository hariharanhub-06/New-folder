import Link from 'next/link';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { getOrderById } from '@/lib/db';
import Invoice from '@/components/Invoice';

export default async function SuccessPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const orderId = searchParams.orderId as string;

    if (!orderId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <h1 className="text-2xl font-bold text-slate-900">Invalid Order</h1>
                <Link href="/" className="mt-4 text-indigo-600 hover:text-indigo-500">Return Home</Link>
            </div>
        );
    }

    // Fetch order details
    const order = await getOrderById(orderId);

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <h1 className="text-2xl font-bold text-slate-900">Order Not Found</h1>
                <Link href="/" className="mt-4 text-indigo-600 hover:text-indigo-500">Return Home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Success Message */}
                <div className="text-center mb-12">
                    <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Order Placed Successfully!</h1>
                    <p className="text-slate-600 text-lg mb-2">Thank you for your purchase.</p>
                    <p className="text-slate-500">Your order has been confirmed and is being processed.</p>
                </div>

                {/* Invoice */}
                <Invoice order={order} />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 print:hidden">
                    <Link
                        href="/"
                        className="flex items-center justify-center px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Return to Home
                    </Link>
                    <Link
                        href="/shop"
                        className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>

                {/* Additional Info */}
                <div className="mt-8 text-center text-sm text-slate-500 print:hidden">
                    <p>You can track your order status by contacting our support team with your Order ID.</p>
                    <p className="mt-2">Customer Support: <span className="font-medium">+91 80151 03119</span></p>
                </div>
            </div>
        </div>
    );
}
