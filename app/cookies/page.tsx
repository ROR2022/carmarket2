"use client"

import { useTranslation } from "@/utils/translation-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

export default function CookiesPage() {
  const { t } = useTranslation();

  return (
    <div className="container py-12">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {t('cookies.title')}
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          {t('cookies.subtitle')}
        </p>
      </div>

      <div className="mt-12 space-y-8">
        {/* What are cookies section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('cookies.whatAreCookies.title')}</CardTitle>
            <CardDescription>{t('cookies.whatAreCookies.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('cookies.whatAreCookies.description')}</p>
          </CardContent>
        </Card>

        {/* Types of cookies section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('cookies.types.title')}</CardTitle>
            <CardDescription>{t('cookies.types.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {['essential', 'analytics', 'functional', 'marketing'].map((type) => (
              <div key={type} className="flex items-start space-x-4">
                <div className="mt-1">
                  {['essential'].includes(type) ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{t(`cookies.types.${type}.title`)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`cookies.types.${type}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* How we use cookies section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('cookies.usage.title')}</CardTitle>
            <CardDescription>{t('cookies.usage.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('cookies.usage.description')}</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {['improve', 'analyze', 'personalize', 'remember'].map((item) => (
                <li key={item}>{t(`cookies.usage.items.${item}`)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Cookie management section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('cookies.management.title')}</CardTitle>
            <CardDescription>{t('cookies.management.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('cookies.management.description')}</p>
            <div className="space-y-2">
              {['browser', 'preferences', 'thirdParty'].map((item) => (
                <p key={item} className="text-sm text-muted-foreground">
                  {t(`cookies.management.options.${item}`)}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 