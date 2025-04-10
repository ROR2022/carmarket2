import { redirect } from 'next/navigation';
//import { auth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { SellerDashboard } from '@/components/analytics/seller-dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard del Vendedor | Car Marketplace',
  description: 'Visualiza métricas y estadísticas de tus vehículos en venta.'
};

export default async function SellerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Redirigir a login si no hay sesión
  if (!user) {
    redirect('/sign-in?callbackUrl=/seller/dashboard');
  }
  
  const userId = user.id;
  
  return (
    <main className="container mx-auto py-6 px-4">
      <SellerDashboard sellerId={userId} />
    </main>
  );
} 