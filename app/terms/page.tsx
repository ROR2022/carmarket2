"use client"

import { useTranslation } from "@/utils/translation-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Scale, Shield, AlertCircle, Handshake, Gavel } from "lucide-react";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="container py-12">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {t('terms.title')}
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          {t('terms.subtitle')}
        </p>
      </div>

      <div className="mt-12 space-y-8">
        {/* Introduction section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('terms.introduction.title')}</CardTitle>
            <CardDescription>{t('terms.introduction.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('terms.introduction.description')}</p>
          </CardContent>
        </Card>

        {/* Acceptance section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('terms.acceptance.title')}</CardTitle>
            <CardDescription>{t('terms.acceptance.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('terms.acceptance.description')}</p>
            <div className="flex items-start space-x-4">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">{t('terms.acceptance.conditions.title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('terms.acceptance.conditions.description')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User responsibilities section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('terms.responsibilities.title')}</CardTitle>
            <CardDescription>{t('terms.responsibilities.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('terms.responsibilities.description')}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {['account', 'content', 'conduct', 'security'].map((item) => (
                <div key={item} className="flex items-start space-x-2">
                  {item === 'account' && <Scale className="h-5 w-5 text-primary mt-0.5" />}
                  {item === 'content' && <FileText className="h-5 w-5 text-primary mt-0.5" />}
                  {item === 'conduct' && <AlertCircle className="h-5 w-5 text-primary mt-0.5" />}
                  {item === 'security' && <Shield className="h-5 w-5 text-primary mt-0.5" />}
                  <div>
                    <h4 className="font-medium">{t(`terms.responsibilities.items.${item}.title`)}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t(`terms.responsibilities.items.${item}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Intellectual property section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('terms.intellectualProperty.title')}</CardTitle>
            <CardDescription>{t('terms.intellectualProperty.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('terms.intellectualProperty.description')}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {['ownership', 'licenses', 'infringement'].map((item) => (
                <div key={item} className="flex items-start space-x-2">
                  <Gavel className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">{t(`terms.intellectualProperty.items.${item}.title`)}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t(`terms.intellectualProperty.items.${item}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Limitation of liability section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('terms.liability.title')}</CardTitle>
            <CardDescription>{t('terms.liability.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('terms.liability.description')}</p>
            <div className="flex items-start space-x-4">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">{t('terms.liability.disclaimer.title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('terms.liability.disclaimer.description')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Changes to terms section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('terms.changes.title')}</CardTitle>
            <CardDescription>{t('terms.changes.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('terms.changes.description')}</p>
            <div className="flex items-start space-x-4">
              <Handshake className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">{t('terms.changes.notification.title')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('terms.changes.notification.description')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('terms.contact.title')}</CardTitle>
            <CardDescription>{t('terms.contact.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('terms.contact.description')}</p>
            <div className="space-y-2">
              {['email', 'address', 'phone'].map((item) => (
                <p key={item} className="text-sm text-muted-foreground">
                  {t(`terms.contact.details.${item}`)}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 