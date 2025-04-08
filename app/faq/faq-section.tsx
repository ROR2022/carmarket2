"use client"

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Car, CreditCard, ShieldCheck, Truck, Clock, HelpCircle } from "lucide-react";
import Link from "next/link";


interface FaqItem {
  question: string;
  answer: string;
  icon: React.ReactElement;
  category: string;
}

export function FaqSection() {
  

  
  const faqItems: FaqItem[] = [
    {
      question: "¿Cómo funciona el proceso de compra de un vehículo?",
      answer: "El proceso es simple: explora nuestro catálogo, aplica filtros para encontrar el auto ideal, agenda una prueba de manejo, solicita financiamiento si lo necesitas, y finaliza la compra. Todo el papeleo se maneja digitalmente y puedes recibir tu auto en tan solo 48 horas.",
      icon: <Car className="h-5 w-5 text-primary" />,
      category: "Compra"
    },
    {
      question: "¿Qué garantía tienen los vehículos?",
      answer: "Todos nuestros vehículos incluyen una garantía mecánica de 3 meses o 5,000 kilómetros, lo que ocurra primero. Adicionalmente, ofrecemos una garantía de satisfacción de 7 días: si no estás conforme, devuelves el auto y te reembolsamos el 100% del pago.",
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
      category: "Garantías"
    },
    {
      question: "¿Cómo funciona el financiamiento?",
      answer: "Trabajamos con múltiples instituciones financieras para ofrecerte las mejores tasas. Puedes solicitar financiamiento directamente en nuestra plataforma y recibir una respuesta en menos de 24 horas. Ofrecemos planes desde 12 hasta 60 meses con tasas competitivas y opciones de pago inicial desde el 10%.",
      icon: <CreditCard className="h-5 w-5 text-primary" />,
      category: "Financiamiento"
    },
    {
      question: "¿Cuál es el proceso de inspección de los vehículos?",
      answer: "Cada vehículo pasa por una rigurosa inspección de 240 puntos realizada por técnicos certificados. Verificamos sistemas mecánicos, eléctricos, carrocería, interior, y realizamos una prueba de manejo exhaustiva. Solo los vehículos que cumplen con nuestros estándares son puestos a la venta.",
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
      category: "Inspección"
    },
    {
      question: "¿Cómo vendo mi auto en la plataforma?",
      answer: "Para vender tu auto, completa el formulario en línea con los datos básicos de tu vehículo para recibir una valoración preliminar. Luego agendamos una inspección gratuita, te presentamos una oferta competitiva y, si la aceptas, realizamos el pago en menos de 24 horas mediante transferencia bancaria.",
      icon: <Car className="h-5 w-5 text-primary" />,
      category: "Venta"
    },
    {
      question: "¿Puedo probar el vehículo antes de comprarlo?",
      answer: "¡Absolutamente! Puedes agendar una prueba de manejo sin compromiso en cualquiera de nuestras ubicaciones o solicitar que llevemos el vehículo a tu domicilio para probarlo (sujeto a disponibilidad en tu zona). La prueba dura aproximadamente 45 minutos y te permite experimentar todas las características del auto.",
      icon: <Car className="h-5 w-5 text-primary" />,
      category: "Prueba"
    },
    {
      question: "¿Hacen envíos a otras ciudades?",
      answer: "Sí, ofrecemos servicio de entrega a domicilio en todas las ciudades principales. El costo del envío depende de la distancia y se calcula automáticamente en el proceso de compra. El tiempo estimado de entrega es de 2-5 días hábiles dependiendo de la ubicación.",
      icon: <Truck className="h-5 w-5 text-primary" />,
      category: "Envíos"
    },
    {
      question: "¿Qué documentación necesito para comprar un auto?",
      answer: "Para comprar un vehículo necesitas una identificación oficial vigente, comprobante de domicilio reciente, y en caso de financiamiento, comprobante de ingresos de los últimos 3 meses. Todo el proceso de documentación se puede realizar digitalmente a través de nuestra plataforma segura.",
      icon: <Clock className="h-5 w-5 text-primary" />,
      category: "Documentación"
    },
    {
      question: "¿Qué pasa si el vehículo presenta alguna falla después de la compra?",
      answer: "Si tu vehículo presenta alguna falla cubierta por la garantía, simplemente contacta a nuestro servicio al cliente. Coordinaremos la revisión y reparación sin costo adicional en cualquiera de nuestros talleres asociados. En casos especiales, podemos proporcionar un vehículo de reemplazo durante el tiempo que dure la reparación.",
      icon: <HelpCircle className="h-5 w-5 text-primary" />,
      category: "Post-venta"
    }
  ];

  // Agrupar las preguntas por categoría para la visualización
  const categories = [
    { id: "compra", name: "Compra", icon: <Car className="h-6 w-6" /> },
    { id: "venta", name: "Venta", icon: <CreditCard className="h-6 w-6" /> },
    { id: "garantias", name: "Garantías", icon: <ShieldCheck className="h-6 w-6" /> }
  ];
  
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2 w-fit gap-2 border border-primary/20">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Preguntas frecuentes
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Resolvemos tus dudas</h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Todo lo que necesitas saber sobre nuestro proceso de compra y venta de vehículos
          </p>
        </div>
        
        {/* Categorías de FAQ en móvil */}
        <div className="md:hidden flex overflow-x-auto pb-4 mt-8 gap-3 hide-scrollbar">
          {categories.map((category) => (
            <div 
              key={category.id}
              className="flex-none bg-background rounded-lg p-4 border flex flex-col items-center min-w-[120px]"
            >
              <div className="p-2 bg-primary/10 rounded-full">
                {category.icon}
              </div>
              <span className="mt-2 text-sm font-medium">{category.name}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-12 mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left flex items-center">
                  <div className="flex items-center">
                    <span className="mr-3 flex-shrink-0">{item.icon}</span>
                    <span>{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">¿Tienes más preguntas? Nuestro equipo está listo para ayudarte</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild>
                <Link href={`/contact`}>Contactanos</Link>
              </Button>
              
            </div>
          </div>
        </div>
      </div>
      
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
    </section>
  );
} 