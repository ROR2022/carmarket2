import { ListingAnalytics } from '@/components/analytics/listing-analytics';
import { auth } from '@/auth';
//import { ListingService } from '@/services/listings';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
//import { AnalyticsService } from '@/services/analytics';
import axios from 'axios';
interface ListingAnalyticsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ListingAnalyticsPageProps): Promise<Metadata> {
  try {
    //const listing = await ListingService.getById((await params).id);
    const response = await axios.post('/api/listings', {
      methodSelected: 'getById',
      sentParams: {
        listingId: (await params).id
      }
    });
    const listing = response.data;
    return {
      title: `Analíticas: ${listing?.title} | Car Marketplace`,
      description: `Estadísticas y rendimiento de la publicación ${listing?.title}`
    };
  } catch {
    return {
      title: 'Analíticas de Publicación | Car Marketplace',
      description: 'Estadísticas y rendimiento de tu publicación'
    };
  }
}

export default async function ListingAnalyticsPage({ params }: ListingAnalyticsPageProps) {
  const session = await auth();
  
  // Redirigir a login si no hay sesión
  if (!session || !session.user) {
    redirect('/login?callbackUrl=/cars/' + (await params).id + '/analytics');
  }
  
  // Obtener datos de la publicación
  //const listing = await ListingService.getById((await params).id);
  const response = await axios.post('/api/listings', {
    methodSelected: 'getById',
    sentParams: {
      listingId: (await params).id
    }
  });
  const listing = response.data;
  // Verificar que el usuario sea el propietario
  if (listing?.sellerId !== session.user.id) {
    redirect('/cars/' + (await params).id);
  }
  
  try {
    //const _analytics = await AnalyticsService.getListingAnalytics((await params).id);
    const response = await axios.post('/api/analytics', {
      methodSelected: 'getListingAnalytics',
      sentParams: {
        listingId: (await params).id
      }
    }); 
    const _analytics = response.data;
    return (
      <main className="container mx-auto py-6 px-4">
        <ListingAnalytics listingId={(await params).id} listing={listing} />
      </main>
    );
  } catch {
    return (
      <main className="container mx-auto py-6 px-4">
        <ListingAnalytics listingId={(await params).id} listing={listing} />
      </main>
    );
  }
} 