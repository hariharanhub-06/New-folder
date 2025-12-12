import { getProduct } from '@/lib/db';
import EditProductForm from './EditProductForm';

// This is a Server Component that fetches data and renders the Client Form
export default async function EditProductPage({ params }: { params: { id: string } }) {
    const product = await getProduct(params.id);

    if (!product) {
        return <div>Product not found</div>;
    }

    return <EditProductForm product={product} />;
}
