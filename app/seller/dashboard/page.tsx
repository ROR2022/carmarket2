import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SellerDashboard } from '@/components/analytics/seller-dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard del Vendedor | Car Marketplace',
  description: 'Visualiza métricas y estadísticas de tus vehículos en venta.'
};

export default async function SellerDashboardPage() {
  const session = await auth();
  
  // Redirigir a login si no hay sesión
  if (!session || !session.user) {
    redirect('/sign-in?callbackUrl=/seller/dashboard');
  }
  
  const userId = session.user.id;
  
  return (
    <main className="container mx-auto py-6 px-4">
      <SellerDashboard sellerId={userId} />
    </main>
  );
} 