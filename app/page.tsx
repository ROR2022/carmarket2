"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import FeaturedCars from "@/components/featured-cars"
import HowItWorks from "@/components/how-it-works"
import CarCategories from "@/components/car-categories"
import { useTranslation } from "@/utils/translation-context"
import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  
  // Manejar el envío del formulario de búsqueda
  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      // Redirigir a la página de autos con el término de búsqueda como parámetro
      router.push(`/cars?searchTerm=${encodeURIComponent(searchTerm.trim())}`)
    }
  }
  
  return (
    <div className="flex flex-col min-h-screen pt-8" style={{ maxWidth: '95vw', margin: 'auto' }}>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-900 to-slate-800 text-white py-20" >
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("homePage.hero.title")}</h1>
            <p className="text-xl mb-8">{t("homePage.hero.subtitle")}</p>

            <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t("homePage.hero.searchPlaceholder")}
                      className="w-full text-black dark:text-white pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" size="lg" className="shrink-0">
                  {t("homePage.hero.searchButton")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <FeaturedCars />

      {/* How It Works */}
      <HowItWorks />

      {/* Car Categories */}
      <CarCategories />

      {/* CTA Section */}
      <section className="bg-primary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t("homePage.cta.title")}</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            {t("homePage.cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/cars">{t("homePage.cta.browseAllCars")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sell">{t("homePage.cta.sellYourCar")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

