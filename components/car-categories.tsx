"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/utils/translation-context"

export default function CarCategories() {
  const { t } = useTranslation()
  
  const categories = [
    {
      name: t("carCategories.categories.sedans"),
      image: "/images/cars/toyota_corolla_2018_sedan.jpeg",
      count: 120,
      slug: "sedan",
    },
    {
      name: t("carCategories.categories.suvs"),
      image: "/images/cars/dodge_journey_2019_suv.jpeg",
      count: 85,
      slug: "suv",
    },
    {
      name: t("carCategories.categories.hatchbacks"),
      image: "/images/cars/nissan_march_2018_hatchback.jpeg",
      count: 64,
      slug: "hatchback",
    },
    {
      name: t("carCategories.categories.trucks"),
      image: "/images/cars/nissan_np300_2020_doble_cabina.jpeg",
      count: 42,
      slug: "truck",
    },
  ]

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">{t("carCategories.title")}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link href={`/cars?category=${category.slug}`} key={category.slug}>
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  width={250}
                  height={150}
                  className="w-full h-40 object-cover"
                />
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <span className="text-sm text-muted-foreground">{category.count} {t("carCategories.cars")}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

