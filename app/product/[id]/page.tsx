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
        title: product.name,
        description: product.description.slice(0, 160), // SEO best practice: keep description under 160 chars
        alternates: {
            canonical: `/product/${params.id}`,
        },
        openGraph: {
            title: product.name,
            description: product.description,
            images: [
                {
                    url: product.imageUrl,
                    width: 800,
                    height: 600,
                    alt: product.name,
                }
            ],
            type: 'website',
        },
    };
}

export default async function ProductPage({ params }: Props) {
    const product = await getProduct(params.id);

    if (!product) {
        notFound();
    }

    // JSON-LD Structured Data for Rich Results
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.imageUrl,
        description: product.description,
        sku: product.id,
        offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'INR',
            availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `https://startupmenswear.in/product/${params.id}`,
        },
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Add JSON-LD to the page */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductDetail product={product} />
        </div>
    );
}
