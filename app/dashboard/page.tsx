import { redirect } from 'next/navigation';
import { getCurrentSessionUser } from '@/lib/auth-session';

export const dynamic = 'force-dynamic';

export default async function DashboardRouterPage() {
  const user = await getCurrentSessionUser();
  if (!user) {
    redirect('/login?next=/dashboard');
  }
  if (user.role === 'provider') {
    redirect('/dashboard/provider');
  }
  if (user.role === 'admin') {
    redirect('/dashboard/admin');
  }
  redirect('/dashboard/client');
}
