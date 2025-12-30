import { getProduct } from '@/lib/db';
import EditProductForm from '@/components/EditProductForm';

// This is a Server Component that fetches data and renders the Client Form
export default async function EditProductPage({
    params,
    searchParams
}: {
    params: { id: string },
    searchParams: { page?: string }
}) {
    const product = await getProduct(params.id);

    if (!product) {
        return <div>Product not found</div>;
    }

    return <EditProductForm product={product} initialPage={searchParams.page || '1'} />;
}
