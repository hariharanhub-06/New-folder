"use client";

import { removeProduct } from '@/lib/actions';
import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';

interface DeleteProductButtonProps {
    id: string;
    onDelete?: () => void;
}

export default function DeleteProductButton({ id, onDelete }: DeleteProductButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        startTransition(async () => {
            const result = await removeProduct(id);
            if (result?.success) {
                if (onDelete) {
                    onDelete();
                } else {
                    window.location.reload();
                }
            } else {
                alert(`Error: ${result?.error || 'Failed to delete product'}`);
            }
        });
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-600 hover:text-red-900 disabled:opacity-50"
        >
            <Trash2 className="w-5 h-5" />
        </button>
    );
}
