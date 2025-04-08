'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
//import { BarChart, LineChart, DonutChart } from '@tremor/react';
import { Loader2, AlertCircle, EyeIcon, MessageSquare, Calendar } from 'lucide-react';
import { CarListing } from '@/types/listing';
import { toast } from 'sonner';
import { TimePeriod } from '@/services/analytics';
import axios from 'axios';

interface AnalyticsData {
  viewCount: number;
  contactCount: number;
  dailyViews: Array<{ date: string; views: number }>;
  weeklyViews?: Array<{ date: string; views: number }>;
  trafficSources?: Array<{ source: string; value: number }>;
  conversionRate?: number;
  
  // Campos adicionales detectados en el código
  views: number;
  contacts: number;
  viewsTrend: number;
  contactRate: number;
  daysActive: number;
  performanceData: Array<{ name: string; Performance: number }>;
  sources: Array<{ source: string; value: number }>;
}

interface ListingAnalyticsProps {
  listingId: string;
  listing?: CarListing;
  data?: AnalyticsData;
}

// Interface that matches the structure returned by AnalyticsService.getListingAnalytics
interface ListingAnalyticsData {
  views: number;
  contacts: number;
  dailyViews: Array<{ date: string; views: number }>;
  weeklyViews: Array<{ date: string; views: number }>;
  trafficSources: Array<{ source: string; value: number }>;
  conversionRate: number;
  viewsTrend: number;
  contactRate: number;
  daysActive: number;
  performanceData: Array<{ name: string; Performance: number }>;
  sources: Array<{ source: string; value: number }>;
}

export function ListingAnalytics({ listingId, listing, data: initialData }: ListingAnalyticsProps) {
  const [period, setPeriod] = useState<TimePeriod>('month');
  const [data, setData] = useState<AnalyticsData | null>(initialData || null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recLoading, setRecLoading] = useState<boolean>(false);
  const [_loading, setLoading] = useState<boolean>(!initialData);
  

  // Cargar datos analíticos
  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        //const analyticsData = await AnalyticsService.getListingAnalytics(listingId, period) as ListingAnalyticsData;
        const response = await axios.post('/api/analytics', {
          methodSelected: 'getListingAnalytics',
          sentParams: {
            listingId,
            period
          }
        });
        const analyticsData = response.data as ListingAnalyticsData;
        // Asegurar que todos los campos requeridos estén presentes
        setData({
          viewCount: analyticsData.views || 0,
          contactCount: analyticsData.contacts || 0,
          dailyViews: analyticsData.dailyViews || [],
          weeklyViews: analyticsData.weeklyViews || [],
          trafficSources: analyticsData.trafficSources || [],
          conversionRate: analyticsData.conversionRate || 0,
          views: analyticsData.views || 0,
          contacts: analyticsData.contacts || 0,
          viewsTrend: analyticsData.viewsTrend || 0,
          contactRate: analyticsData.contactRate || 0,
          daysActive: analyticsData.daysActive || 0,
          performanceData: analyticsData.performanceData || [],
          sources: analyticsData.sources || []
        });
      } catch (error) {
        console.error('Error loading listing analytics:', error);
        toast.error('No se pudieron cargar los datos analíticos');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [listingId, period]);

  // Cargar recomendaciones
  useEffect(() => {
    const loadRecommendations = async () => {
      setRecLoading(true);
      try {
        //const recs = await AnalyticsService.generateListingRecommendations(listingId);
        const response = await axios.post('/api/analytics', {
          methodSelected: 'generateListingRecommendations',
          sentParams: {
            listingId
          }
        });
        const recs = response.data as string[];
        
        setRecommendations(recs);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setRecLoading(false);
      }
    };

    loadRecommendations();
  }, [listingId]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando datos analíticos...</p>
      </div>
    );
  }

  // Datos simulados si no hay datos reales
  /*
  const viewsData = data.dailyViews || [
    { date: 'Lun', views: 3 },
    { date: 'Mar', views: 5 },
    { date: 'Mié', views: 2 },
    { date: 'Jue', views: 7 },
    { date: 'Vie', views: 9 },
    { date: 'Sáb', views: 6 },
    { date: 'Dom', views: 4 }
  ];

  const contactRatioData = [
    { name: 'Vistas sin contacto', value: data.views - data.contacts || 80 },
    { name: 'Contactos', value: data.contacts || 20 }
  ];

  const performanceData = data.performanceData || [
    { name: 'Esta publicación', Performance: 75 },
    { name: 'Promedio', Performance: 60 }
  ];
  */

  const visitorSources = data.sources || [
    { source: 'Búsqueda directa', value: 45 },
    { source: 'Búsqueda por filtros', value: 30 },
    { source: 'Recomendaciones', value: 15 },
    { source: 'Enlaces externos', value: 10 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analítica de Publicación</h2>
          <p className="text-muted-foreground">
            {listing ? listing.title : 'Detalles de rendimiento de su publicación'}
          </p>
        </div>
        
        <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
          <TabsList>
            <TabsTrigger value="week">7 días</TabsTrigger>
            <TabsTrigger value="month">30 días</TabsTrigger>
            <TabsTrigger value="year">Año</TabsTrigger>
            <TabsTrigger value="all">Todo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vistas totales</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{data.views}</CardTitle>
              <EyeIcon className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <span className={`mr-1 ${data.viewsTrend > 0 ? 'text-green-500' : data.viewsTrend < 0 ? 'text-red-500' : ''}`}>
                {data.viewsTrend > 0 ? '↑' : data.viewsTrend < 0 ? '↓' : '→'}
              </span>
              <p className="text-muted-foreground">
                {data.viewsTrend > 0 
                  ? `${data.viewsTrend}% más que el período anterior` 
                  : data.viewsTrend < 0 
                    ? `${Math.abs(data.viewsTrend)}% menos que el período anterior`
                    : 'Sin cambios respecto al período anterior'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contactos recibidos</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{data.contacts}</CardTitle>
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tasa de conversión: {data.contactRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Días publicado</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{data.daysActive}</CardTitle>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Promedio de {(data.views / Math.max(1, data.daysActive)).toFixed(1)} vistas por día
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y análisis detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vistas diarias</CardTitle>
            <CardDescription>Evolución de vistas en el tiempo</CardDescription>
          </CardHeader>
          <CardContent>
          {/**
           *
           * <LineChart
              data={viewsData}
              index="date"
              categories={['views']}
              colors={['indigo']}
              valueFormatter={(value) => `${value} vistas`}
              showLegend={false}
              className="h-64"
            /> 
           * 
           */}
            <span>En desarrollo...</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de visitas vs contactos</CardTitle>
            <CardDescription>Proporción de vistas que resultan en contacto</CardDescription>
          </CardHeader>
          <CardContent>
            <span>En desarrollo...</span>
            {/* <DonutChart
              data={contactRatioData}
              category="value"
              index="name"
              valueFormatter={(value) => `${value}`}
              colors={['slate', 'violet']}
              className="h-64"
            /> */}
          </CardContent>
        </Card>
      </div>

      {/* Comparativa de rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativa de rendimiento</CardTitle>
          <CardDescription>Comparación con publicaciones similares</CardDescription>
        </CardHeader>
        <CardContent>
          <span>En desarrollo...</span>
          {/* <BarChart
            data={performanceData}
            index="name"
            categories={['Performance']}
            colors={['emerald']}
            valueFormatter={(value) => `${value}%`}
            className="h-64"
          /> */}
        </CardContent>
      </Card>

      {/* Fuentes de tráfico */}
      <Card>
        <CardHeader>
          <CardTitle>Fuentes de tráfico</CardTitle>
          <CardDescription>De dónde vienen los visitantes de esta publicación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {visitorSources.map((source) => (
              <div key={source.source} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{source.source}</span>
                  <span className="text-sm text-muted-foreground">{source.value}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${source.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones de mejora */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recomendaciones de mejora</h3>
        
        {recLoading ? (
          <div className="flex items-center gap-2 p-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Analizando publicación...</span>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <Alert key={index}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sugerencia {index + 1}</AlertTitle>
                <AlertDescription>{rec}</AlertDescription>
              </Alert>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>¡Excelente trabajo!</AlertTitle>
            <AlertDescription>Su publicación está bien optimizada.</AlertDescription>
          </Alert>
        )}
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <a href={`/cars/${listingId}/edit`}>Editar publicación</a>
        </Button>
      </div>
    </div>
  );
} 