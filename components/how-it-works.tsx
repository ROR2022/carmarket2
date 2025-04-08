"use client"

import { CheckCircle, Car, CreditCard, ShieldCheck } from "lucide-react"
import { useTranslation } from "@/utils/translation-context"

export default function HowItWorks() {
  const { t } = useTranslation()
  
  const steps = [
    {
      icon: <Car className="h-10 w-10 text-primary" />,
      title: t("howItWorks.steps.browseSelect.title"),
      description: t("howItWorks.steps.browseSelect.description"),
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
      title: t("howItWorks.steps.qualityGuarantee.title"),
      description: t("howItWorks.steps.qualityGuarantee.description"),
    },
    {
      icon: <CreditCard className="h-10 w-10 text-primary" />,
      title: t("howItWorks.steps.flexibleFinancing.title"),
      description: t("howItWorks.steps.flexibleFinancing.description"),
    },
    {
      icon: <CheckCircle className="h-10 w-10 text-primary" />,
      title: t("howItWorks.steps.securePurchase.title"),
      description: t("howItWorks.steps.securePurchase.description"),
    },
  ]

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-12 text-center">{t("howItWorks.title")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

