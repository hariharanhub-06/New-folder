"use client";

import { useEffect, useState } from 'react';

export default function TestTagPage() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch('/api/products?tag=formal-shirts')
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, []);

    if (!data) return <div>Loading...</div>;

    return (
        <div className="p-10">
            <h1>Test Tag: formal-shirts</h1>
            <pre className="bg-gray-100 p-4 rounded">
                {JSON.stringify({
                    total: data.pagination?.total,
                    count: data.data?.length,
                    names: data.data?.map((p: any) => p.name)
                }, null, 2)}
            </pre>
        </div>
    );
}
