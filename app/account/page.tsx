import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCustomerById } from '@/lib/db';
import Link from 'next/link';
import { Package, User } from 'lucide-react';
import AddressManager from '@/components/AddressManager';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default async function AccountPage() {
    const customerId = cookies().get('customer_session')?.value;
    if (!customerId) redirect('/login?next=/account');

    const customer = await getCustomerById(customerId);
    if (!customer) redirect('/login?next=/account');

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold uppercase tracking-[0.3em]">My Account</h1>

                {/* Profile Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-7 h-7 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{customer.name}</h2>
                            <p className="text-sm text-gray-500">Member since {new Date(customer.createdAt!).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Mobile</p>
                            <p className="text-sm font-semibold text-gray-900">{customer.mobile}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Email</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{customer.email}</p>
                        </div>
                    </div>
                </div>

                {/* My Orders */}
                <Link href="/account/orders" className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                            <Package className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">My Orders</h3>
                            <p className="text-sm text-gray-500">Track your purchases and order history</p>
                        </div>
                    </div>
                    <span className="text-gray-400 group-hover:text-indigo-600 transition-colors">→</span>
                </Link>

                {/* Saved Addresses */}
                <AddressManager />

                {/* Change Password */}
                <ChangePasswordForm />
            </div>
        </div>
    );
}
