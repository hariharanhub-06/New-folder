'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
}

const faqs: FAQItem[] = [
    {
        question: "How many days does delivery take?",
        answer: "Delivery time depends on the customer’s location. The dispatch process will be initiated within 2 days from the date the order is placed. Once the order is handed over to the courier, the customer will receive a WhatsApp message with the courier partner details and the tracking ID."
    },
    {
        question: "Is Cash on Delivery (COD) available?",
        answer: "No. Due to certain internal policies and operational concerns, Cash on Delivery is currently not available."
    },
    {
        question: "Is return available?",
        answer: "Yes, returns are accepted only in genuine cases such as receiving a wrong product or a damaged product. Once the customer raises a return request, the issue will be verified. If the damage or error is from our side or during transit, the refund will be processed. If the damage is due to customer mishandling, the refund will not be applicable."
    },
    {
        question: "What is the shipping cost?",
        answer: "Shipping charges vary based on the customer’s location and will be shown at checkout before payment."
    }
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-20 bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold mb-4">
                        <HelpCircle className="w-4 h-4" />
                        Common Questions
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'shadow-md border-indigo-200 bg-indigo-50/30' : 'hover:border-slate-300'}`}
                        >
                            <button
                                onClick={() => toggleAccordion(index)}
                                className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                            >
                                <span className={`font-semibold text-lg transition-colors ${openIndex === index ? 'text-indigo-700' : 'text-slate-800'}`}>
                                    {faq.question}
                                </span>
                                {openIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                )}
                            </button>

                            <div
                                className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="p-5 pt-0 text-slate-600 leading-relaxed border-t border-indigo-100/50">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
