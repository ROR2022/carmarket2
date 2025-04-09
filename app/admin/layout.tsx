'use client';

import { useAuth } from "@/utils/auth-hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/utils/translation-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/sign-in');
    } else if (!loading && isAuthenticated && !isAdmin) {
      router.push('/');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Verificando permisos...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // No renderizar nada mientras redirecciona
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/admin" className="font-semibold">
              {t('admin.title')}
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/admin" className="text-sm font-medium transition-colors hover:text-primary">
                Dashboard
              </Link>
              <Link href="/admin/listings" className="text-sm font-medium transition-colors hover:text-primary">
                Anuncios
              </Link>
              <Link href="/admin/users" className="text-sm font-medium transition-colors hover:text-primary">
                Usuarios
              </Link>
              <Link href="/admin/settings" className="text-sm font-medium transition-colors hover:text-primary">
                Configuración
              </Link>
            </nav>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Volver al sitio</Link>
          </Button>
        </div>
      </header>
      
      <div className="container flex-1 pt-6 pb-16">
        {children}
      </div>
    </div>
  );
} 