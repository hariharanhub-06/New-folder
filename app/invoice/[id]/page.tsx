import { getOrderById } from '@/lib/db';
import Invoice from '@/components/Invoice';
import { notFound } from 'next/navigation';

export default async function InvoicePage({ params }: { params: { id: string } }) {
    const order = await getOrderById(params.id);

    if (!order) {
        notFound();
    }

    return <Invoice order={order} />;
}
