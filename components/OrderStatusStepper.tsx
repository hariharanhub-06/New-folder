"use client";

const ORDER_STEPS = ['Payment Confirmed', 'Parcel Prepared', 'Couried', 'Delivered'] as const;

type OrderStatus = 'Pending Payment' | 'Payment Failed' | 'Payment Confirmed' | 'Parcel Prepared' | 'Couried' | 'Delivered' | 'Cancelled';

interface OrderStatusStepperProps {
    status: OrderStatus;
}

export default function OrderStatusStepper({ status }: OrderStatusStepperProps) {
    if (status === 'Cancelled') {
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                Cancelled
            </span>
        );
    }

    if (status === 'Pending Payment' || status === 'Payment Failed') {
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                {status}
            </span>
        );
    }

    const currentIndex = ORDER_STEPS.indexOf(status as typeof ORDER_STEPS[number]);

    return (
        <div className="flex items-center gap-0 mt-3">
            {ORDER_STEPS.map((step, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isFuture = index > currentIndex;

                return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                            <div className={`relative w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                                isCompleted
                                    ? 'bg-black border-black'
                                    : isCurrent
                                    ? 'bg-black border-black ring-4 ring-black/20'
                                    : 'bg-white border-gray-300'
                            }`}>
                                {isCompleted && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {isCurrent && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </div>
                            <span className={`mt-1.5 text-[9px] font-bold uppercase tracking-wide text-center max-w-[60px] leading-tight ${
                                isFuture ? 'text-gray-400' : 'text-gray-900'
                            }`}>
                                {step === 'Payment Confirmed' ? 'Confirmed' :
                                 step === 'Parcel Prepared' ? 'Prepared' :
                                 step === 'Couried' ? 'Shipped' : 'Delivered'}
                            </span>
                        </div>
                        {index < ORDER_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 mb-5 ${
                                index < currentIndex ? 'bg-black' : 'bg-gray-200'
                            }`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
