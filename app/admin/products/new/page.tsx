"use client";

import { useRouter } from 'next/navigation';
import AddProductForm from '@/components/AddProductForm';

export default function NewProductPage() {
    const router = useRouter();

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 font-jost uppercase tracking-tighter italic">Add New Product</h1>
            <div className="bg-white shadow-sm rounded-lg p-6">
                <AddProductForm
                    onSuccess={() => router.push('/admin/products')}
                    onCancel={() => router.back()}
                />
            </div>
        </div>
    );
}
