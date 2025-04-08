"use client"

import { useTranslation } from "@/utils/translation-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Database, Share2, Eye, Trash2 } from "lucide-react";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="container py-12">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {t('privacy.title')}
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          {t('privacy.subtitle')}
        </p>
      </div>

      <div className="mt-12 space-y-8">
        {/* Introduction section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.introduction.title')}</CardTitle>
            <CardDescription>{t('privacy.introduction.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('privacy.introduction.description')}</p>
          </CardContent>
        </Card>

        {/* Data collection section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.dataCollection.title')}</CardTitle>
            <CardDescription>{t('privacy.dataCollection.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {['personal', 'usage', 'technical'].map((type) => (
              <div key={type} className="flex items-start space-x-4">
                <div className="mt-1">
                  {type === 'personal' && <Database className="h-5 w-5 text-primary" />}
                  {type === 'usage' && <Share2 className="h-5 w-5 text-primary" />}
                  {type === 'technical' && <Lock className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <h3 className="font-medium">{t(`privacy.dataCollection.types.${type}.title`)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`privacy.dataCollection.types.${type}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data usage section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.dataUsage.title')}</CardTitle>
            <CardDescription>{t('privacy.dataUsage.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('privacy.dataUsage.description')}</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {['service', 'improvement', 'communication', 'security'].map((item) => (
                <li key={item}>{t(`privacy.dataUsage.purposes.${item}`)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Data protection section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.dataProtection.title')}</CardTitle>
            <CardDescription>{t('privacy.dataProtection.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('privacy.dataProtection.description')}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {['encryption', 'access', 'backup', 'compliance'].map((item) => (
                <div key={item} className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">{t(`privacy.dataProtection.measures.${item}.title`)}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t(`privacy.dataProtection.measures.${item}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User rights section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.userRights.title')}</CardTitle>
            <CardDescription>{t('privacy.userRights.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('privacy.userRights.description')}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {['access', 'correction', 'deletion', 'portability'].map((item) => (
                <div key={item} className="flex items-start space-x-2">
                  {item === 'access' && <Eye className="h-5 w-5 text-primary mt-0.5" />}
                  {item === 'correction' && <Share2 className="h-5 w-5 text-primary mt-0.5" />}
                  {item === 'deletion' && <Trash2 className="h-5 w-5 text-primary mt-0.5" />}
                  {item === 'portability' && <Database className="h-5 w-5 text-primary mt-0.5" />}
                  <div>
                    <h4 className="font-medium">{t(`privacy.userRights.rights.${item}.title`)}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t(`privacy.userRights.rights.${item}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.contact.title')}</CardTitle>
            <CardDescription>{t('privacy.contact.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('privacy.contact.description')}</p>
            <div className="space-y-2">
              {['email', 'address', 'phone'].map((item) => (
                <p key={item} className="text-sm text-muted-foreground">
                  {t(`privacy.contact.details.${item}`)}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 