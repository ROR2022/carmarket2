'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Shield, Users, Megaphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslation } from '@/utils/translation-context';

export default function SellPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-background pt-10 pb-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              {t('sell.pageTitle')}
            </h1>
            <p className="max-w-[800px] text-muted-foreground md:text-xl">
              {t('sell.pageSubtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            {/* Left CTA - Valoración */}
            <Card className="relative overflow-hidden border-2 hover:border-primary/70 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl md:text-3xl">
                  {t('sell.sections.valuationCta.title')}
                </CardTitle>
                <CardDescription className="text-base md:text-lg">
                  {t('sell.sections.valuationCta.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-8 h-44 relative rounded-md overflow-hidden">
                  <Image
                    src="/images/cars/valuation.jpeg"
                    alt="Car valuation"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/sell/valuation">
                    {t('sell.sections.valuationCta.buttonText')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Right CTA - Crear Anuncio */}
            <Card className="relative overflow-hidden border-2 hover:border-primary/70 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl md:text-3xl">
                  {t('sell.sections.listingCta.title')}
                </CardTitle>
                <CardDescription className="text-base md:text-lg">
                  {t('sell.sections.listingCta.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-8 h-44 relative rounded-md overflow-hidden">
                  <Image
                    src="/images/cars/listing.jpeg"
                    alt="Create listing"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/sell/list">
                    {t('sell.sections.listingCta.buttonText')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              {t('sell.sections.whyUs.title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {t('sell.sections.whyUs.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t('sell.sections.whyUs.reasons.audience.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('sell.sections.whyUs.reasons.audience.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t('sell.sections.whyUs.reasons.security.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('sell.sections.whyUs.reasons.security.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <CheckCircle className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t('sell.sections.whyUs.reasons.support.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('sell.sections.whyUs.reasons.support.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <Megaphone className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t('sell.sections.whyUs.reasons.visibility.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('sell.sections.whyUs.reasons.visibility.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              {t('sell.sections.process.title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {t('sell.sections.process.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t('sell.sections.process.steps.valuation.title')}
              </h3>
              <p className="text-muted-foreground">
                {t('sell.sections.process.steps.valuation.description')}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t('sell.sections.process.steps.listing.title')}
              </h3>
              <p className="text-muted-foreground">
                {t('sell.sections.process.steps.listing.description')}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t('sell.sections.process.steps.contact.title')}
              </h3>
              <p className="text-muted-foreground">
                {t('sell.sections.process.steps.contact.description')}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t('sell.sections.process.steps.sale.title')}
              </h3>
              <p className="text-muted-foreground">
                {t('sell.sections.process.steps.sale.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              {t('sell.sections.faq.title')}
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  {t('sell.sections.faq.items.fees.question')}
                </AccordionTrigger>
                <AccordionContent>
                  {t('sell.sections.faq.items.fees.answer')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                  {t('sell.sections.faq.items.time.question')}
                </AccordionTrigger>
                <AccordionContent>
                  {t('sell.sections.faq.items.time.answer')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>
                  {t('sell.sections.faq.items.payment.question')}
                </AccordionTrigger>
                <AccordionContent>
                  {t('sell.sections.faq.items.payment.answer')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>
                  {t('sell.sections.faq.items.papers.question')}
                </AccordionTrigger>
                <AccordionContent>
                  {t('sell.sections.faq.items.papers.answer')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-lg">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                {t('homePage.sell_banner.title')}
              </h2>
              <p className="mb-6 text-primary-foreground/90">
                {t('homePage.sell_banner.description')}
              </p>
            </div>
            <div>
              <Button 
                variant="secondary" 
                size="lg" 
                asChild
                className="w-full md:w-auto"
              >
                <Link href="/sell/list">
                  {t('homePage.sell_banner.list_now')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 