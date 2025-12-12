"use client";

import { removeProduct } from '@/lib/actions';
import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';

export default function DeleteProductButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            onClick={() => startTransition(() => removeProduct(id))}
            disabled={isPending}
            className="text-red-600 hover:text-red-900 disabled:opacity-50"
        >
            <Trash2 className="w-5 h-5" />
        </button>
    );
}
