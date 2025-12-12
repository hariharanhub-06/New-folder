import { getProduct } from '@/lib/db';
import ProductDetail from '@/components/ProductDetail';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface Props {
    params: {
        id: string;
    };
}

// Optional: Generate Metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const product = await getProduct(params.id);
    if (!product) return { title: 'Product Not Found' };
    return {
        title: `${product.name} - Startup Menswear`,
        description: product.description,
        openGraph: {
            images: [product.imageUrl],
        },
    };
}

export default async function ProductPage({ params }: Props) {
    const product = await getProduct(params.id);

    if (!product) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <ProductDetail product={product} />
        </div>
    );
}
