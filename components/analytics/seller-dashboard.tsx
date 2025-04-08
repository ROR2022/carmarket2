'use client';

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent as _TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
//import { BarChart, LineChart } from '@tremor/react';
import { 
  Download, 
  EyeIcon, 
  MessageSquare, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Loader2,
  Car
} from 'lucide-react';
import { TimePeriod, SellerStats } from '@/services/analytics';
import { toast } from 'sonner';
import { CarListing } from '@/types/listing';
import Link from 'next/link';
import axios from 'axios';
import { 
  CarCard as _CarCard
} from '@/components/car/car-card';

// Interfaz para métricas de rendimiento
interface PerformanceMetrics {
  conversionRate: number;
  averageResponseTime: number;
  listingQualityScore: number;
  competitivenessScore: number;
  recommendedActions: string[];
  [key: string]: number | string | string[];
}

interface SellerDashboardProps {
  sellerId: string;
}

export function SellerDashboard({ sellerId }: SellerDashboardProps) {
  const [period, setPeriod] = useState<TimePeriod>('month');
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [performanceLoading, setPerformanceLoading] = useState<boolean>(true);
  const [topPerformers, setTopPerformers] = useState<CarListing[]>([]);
  const [lowPerformers, setLowPerformers] = useState<CarListing[]>([]);
  const [_metrics, setMetrics] = useState<PerformanceMetrics>({
    conversionRate: 0,
    averageResponseTime: 0,
    listingQualityScore: 0,
    competitivenessScore: 0,
    recommendedActions: []
  });
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  

  // Cargar estadísticas generales
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        //const sellerStats = await AnalyticsService.getSellerStats(sellerId, period);
        const response = await axios.post('/api/analytics', {
          methodSelected: 'getSellerStats',
          sentParams: {
            period: period
          }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Error loading seller stats:', error);
        toast.error('No se pudieron cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [sellerId, period, toast]);

  // Cargar datos de rendimiento
  useEffect(() => {
    const loadPerformance = async () => {
      setPerformanceLoading(true);
      try {
        //const performance = await AnalyticsService.getListingsPerformance(sellerId);
        const response = await axios.post('/api/analytics', {
          methodSelected: 'getListingsPerformance',
          sentParams: {
            sellerId: sellerId
          }
        });
        setTopPerformers(response.data.topPerformers);
        setLowPerformers(response.data.lowPerformers);
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          ...response.data.performanceMetrics
        }));
      } catch (error) {
        console.error('Error loading performance data:', error);
        toast.error('No se pudieron cargar los datos de rendimiento');
      } finally {
        setPerformanceLoading(false);
      }
    };

    loadPerformance();
  }, [sellerId, toast]);

  // Exportar datos de reservas
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      //const data = await AnalyticsService.exportReservationsData(sellerId, exportFormat, period);
      const response = await axios.post('/api/analytics', {
        methodSelected: 'exportReservationsData',
        sentParams: {
          sellerId: sellerId,
          exportFormat: exportFormat,
          period: period
        }
      });
      // Crear blob y descargar archivo
      const blob = new Blob([response.data], { 
        type: exportFormat === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reservations_${period}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Se han descargado los datos en formato ${exportFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('No se pudieron exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };

  // Mostrar estado de carga
  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando estadísticas...</p>
      </div>
    );
  }

  // Datos para gráficos (simulados)
  /*
  const viewsData = [
    { date: 'Ene', value: 42 },
    { date: 'Feb', value: 68 },
    { date: 'Mar', value: 56 },
    { date: 'Abr', value: 82 },
    { date: 'May', value: 95 },
    { date: 'Jun', value: 84 },
  ];

  const conversionData = [
    { name: 'Vistas', Tasa: stats?.conversionRate || 0 },
    { name: 'Contactos', Tasa: stats?.reservationRate || 0 },
  ];
  */

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard del Vendedor</h2>
        
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <TabsList>
              <TabsTrigger value="week">Esta semana</TabsTrigger>
              <TabsTrigger value="month">Este mes</TabsTrigger>
              <TabsTrigger value="year">Este año</TabsTrigger>
              <TabsTrigger value="all">Todo</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Publicaciones activas</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{stats?.activeListings || 0}</CardTitle>
              <Car className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              De un total de {stats?.totalListings || 0} publicaciones
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vistas totales</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{stats?.totalViews || 0}</CardTitle>
              <EyeIcon className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats && stats.totalListings > 0 
                ? `${stats.averageViewsPerListing.toFixed(1)} vistas por publicación`
                : 'Sin datos suficientes'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contactos recibidos</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{stats?.totalContacts || 0}</CardTitle>
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats && stats.totalViews > 0
                ? `Tasa de conversión: ${stats.conversionRate.toFixed(1)}%`
                : 'Sin datos suficientes'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reservas realizadas</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{stats?.totalReservations || 0}</CardTitle>
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats?.reservedListings || 0} vehículos actualmente reservados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vistas a lo largo del tiempo</CardTitle>
            <CardDescription>Vistas de todas tus publicaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <span>En desarrollo...</span>
            {/* <LineChart
              data={viewsData}
              index="date"
              categories={['value']}
              colors={['indigo']}
              valueFormatter={(value) => `${value} vistas`}
              showLegend={false}
              className="h-64"
            /> */}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tasas de conversión</CardTitle>
            <CardDescription>Porcentaje de conversión entre etapas</CardDescription>
          </CardHeader>
          <CardContent>
            <span>En desarrollo...</span>
            {/* <BarChart
              data={conversionData}
              index="name"
              categories={['Tasa']}
              colors={['violet']}
              valueFormatter={(value) => `${value.toFixed(1)}%`}
              showLegend={false}
              className="h-64"
            /> */}
          </CardContent>
        </Card>
      </div>

      {/* Análisis de rendimiento */}
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold">Análisis de rendimiento</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Publicaciones con mejor rendimiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span>Mejor rendimiento</span>
              </CardTitle>
              <CardDescription>Publicaciones con más interacciones</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {performanceLoading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                </div>
              ) : topPerformers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <p className="text-sm text-muted-foreground">No hay suficientes datos para mostrar</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {topPerformers.map(listing => (
                    <div 
                      key={listing.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative h-12 w-16 overflow-hidden rounded bg-muted">
                        {listing.images && listing.images[0] ? (
                          <Image width={100} height={75} src={listing.images[0]} 
                            alt={listing.title}
                            className="object-cover w-full h-full"
                           />
                        ) : (
                          <Car className="h-6 w-6 absolute inset-0 m-auto text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{listing.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{listing.viewCount} vistas</span>
                          <span>{listing.contactCount} contactos</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/cars/${listing.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Publicaciones con peor rendimiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <span>Necesitan mejoras</span>
              </CardTitle>
              <CardDescription>Publicaciones con menos interacciones</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {performanceLoading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                </div>
              ) : lowPerformers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <p className="text-sm text-muted-foreground">No hay suficientes datos para mostrar</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {lowPerformers.map(listing => (
                    <div 
                      key={listing.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative h-12 w-16 overflow-hidden rounded bg-muted">
                        {listing.images && listing.images[0] ? (
                          <Image width={100} height={75} src={listing.images[0]} 
                            alt={listing.title}
                            className="object-cover w-full h-full"
                           />
                        ) : (
                          <Car className="h-6 w-6 absolute inset-0 m-auto text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{listing.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{listing.viewCount} vistas</span>
                          <span>{listing.contactCount} contactos</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/cars/${listing.id}/edit`}>
                          Mejorar
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Exportación de datos */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar datos de reservas</CardTitle>
          <CardDescription>
            Descarga los datos de tus reservas para análisis detallado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="export-format" className="text-sm font-medium">
                Formato:
              </label>
              <select
                id="export-format"
                className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
            
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exportar datos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 