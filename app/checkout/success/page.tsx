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
                <Invoice order={order} showActions={false} />

                {/* WhatsApp Confirmation Button */}
                <div className="mt-8 flex justify-center print:hidden">
                    <a
                        href={`https://wa.me/918015103119?text=${encodeURIComponent(
                            `Hi Startup Mens Wear! I just placed an order.\n\n` +
                            `Order ID: #${order.id.slice(0, 8)}\n` +
                            `Customer: ${order.customerName}\n` +
                            `Total: ₹${order.totalAmount}\n\n` +
                            `Items:\n${order.items.map(item => `- ${item.name}${item.size ? ` (${item.size})` : ''} x ${item.quantity}`).join('\n')}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-8 py-4 bg-[#25D366] text-white rounded-xl hover:bg-[#22c35e] font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 w-full sm:w-auto"
                    >
                        <svg className="w-6 h-6 mr-2 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.222-4.015c1.516.899 3.123 1.371 4.881 1.373 5.176 0 9.389-4.213 9.391-9.389.001-2.507-.975-4.865-2.748-6.639s-4.132-2.749-6.638-2.749c-5.176 0-9.39 4.213-9.392 9.39-.001 1.761.468 3.328 1.353 4.821l-1.015 3.707 3.801-1.026-.033.022zm10.742-7.139c-.293-.146-1.734-.856-2.002-.954-.268-.099-.463-.148-.658.146-.195.293-.755.954-.926 1.15-.171.195-.341.219-.634.073-.293-.146-1.237-.456-2.356-1.454-.87-.776-1.457-1.734-1.628-2.027-.171-.293-.018-.452.129-.597.132-.131.293-.341.44-.512.147-.171.196-.293.293-.488.098-.195.049-.366-.024-.512-.073-.146-.658-1.587-.902-2.173-.238-.57-.479-.493-.658-.502-.171-.007-.366-.008-.561-.008-.195 0-.512.073-.78.366-.268.293-1.024 1.001-1.024 2.441 0 1.439 1.048 2.83 1.195 3.025.147.195 2.064 3.152 4.998 4.415.698.301 1.244.481 1.67.617.701.223 1.338.192 1.841.117.561-.083 1.734-.708 1.977-1.392.243-.684.243-1.269.171-1.391-.073-.122-.268-.195-.561-.341z" />
                        </svg>
                        Confirm on WhatsApp
                    </a>
                </div>

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
