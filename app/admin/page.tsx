'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminStats } from '@/services/admin';
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileQuestion,
  Users,
  Calendar,
  BarChart,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import axios from 'axios';
//import { useTranslation } from '@/utils/translation-context';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  //const { t } = useTranslation();

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        //const data = await AdminService.getAdminStats();
        const {data} = await axios.post('/api/admin',{
          methodSelected: 'getAdminStats',
          sentParams: {},
        });

        setStats(data.stats);
        setError(null);
      } catch (err) {
        console.error('Error loading admin stats:', err);
        setError('Error al cargar las estadísticas.');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <h2 className="text-lg font-medium">Error al cargar el dashboard</h2>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido al panel de administración. Aquí puedes gestionar todos los aspectos del
          marketplace.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="analytics">Estadísticas</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Anuncios</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalListings}</div>
                <p className="text-xs text-muted-foreground">{stats.newListingsToday} nuevos hoy</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <FileQuestion className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingListings}</div>
                <p className="text-xs text-muted-foreground">Requieren aprobación</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approvedListings}</div>
                <p className="text-xs text-muted-foreground">Anuncios visibles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Usuarios registrados</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Anuncios que requieren acción</CardTitle>
                <CardDescription>Anuncios pendientes de moderación.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileQuestion className="h-5 w-5 text-amber-500" />
                          <span>Pendientes de revisión</span>
                        </div>
                        <span className="font-medium">{stats.pendingListings}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span>Rechazados</span>
                        </div>
                        <span className="font-medium">{stats.rejectedListings}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-blue-500" />
                          <span>Cambios solicitados</span>
                        </div>
                        <span className="font-medium">{stats.changesRequestedListings}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button asChild>
                      <Link href="/admin/listings?status=pending">Ver anuncios pendientes</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acciones rápidas</CardTitle>
                <CardDescription>Acciones comunes de administración.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/admin/listings?status=pending">
                      <FileQuestion className="mr-2 h-4 w-4" />
                      Moderar anuncios
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/admin/settings">
                      <Calendar className="mr-2 h-4 w-4" />
                      Gestionar configuración
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas detalladas</CardTitle>
              <CardDescription>Análisis completo del marketplace.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <p className="text-center text-muted-foreground">
                Las estadísticas detalladas estarán disponibles en una futura actualización.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
