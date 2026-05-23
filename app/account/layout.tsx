import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const customerId = cookies().get('customer_session')?.value;
    if (!customerId) {
        redirect('/login?next=/account');
    }
    return <>{children}</>;
}
