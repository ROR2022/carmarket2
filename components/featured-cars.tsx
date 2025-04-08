"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart } from "lucide-react"
import { useTranslation } from "@/utils/translation-context"

// Sample data - in a real app, this would come from your Supabase database
const cars = [
  {
    id: 1,
    title: "Honda Civic 2020",
    price: 289000,
    location: "Ciudad de México",
    km: 45000,
    image: "/images/cars/honda_civic_2020.jpeg",
    category: "sedan",
  },
  {
    id: 2,
    title: "Toyota RAV4 2021",
    price: 459000,
    location: "Monterrey",
    km: 32000,
    image: "/images/cars/toyota_rav4_2021.jpeg",
    category: "suv",
  },
  {
    id: 3,
    title: "Volkswagen Golf 2019",
    price: 275000,
    location: "Guadalajara",
    km: 50000,
    image: "/images/cars/volkswagen_golf_2019.jpeg",
    category: "hatchback",
  },
  {
    id: 4,
    title: "Mazda CX-5 2022",
    price: 489000,
    location: "Puebla",
    km: 18000,
    image: "/images/cars/mazda_cx_5_2022.jpeg",
    category: "suv",
  },
  {
    id: 5,
    title: "Nissan Sentra 2021",
    price: 299000,
    location: "Ciudad de México",
    km: 28000,
    image: "/images/cars/nissan_sentra_2021.jpeg",
    category: "sedan",
  },
  {
    id: 6,
    title: "Ford Escape 2020",
    price: 379000,
    location: "Querétaro",
    km: 40000,
    image: "/images/cars/ford_escape_2020.jpeg",
    category: "suv",
  },
]

export default function FeaturedCars() {
  const [activeTab, setActiveTab] = useState("all")
  const { t } = useTranslation()

  const filteredCars = activeTab === "all" ? cars : cars.filter((car) => car.category === activeTab)

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">{t("featuredCars.title")}</h2>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <TabsList>
              <TabsTrigger value="all">{t("featuredCars.allCars")}</TabsTrigger>
              <TabsTrigger value="sedan">{t("featuredCars.sedans")}</TabsTrigger>
              <TabsTrigger value="suv">{t("featuredCars.suvs")}</TabsTrigger>
              <TabsTrigger value="hatchback">{t("featuredCars.hatchbacks")}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCars.map((car) => (
                <Card key={car.id} className="overflow-hidden">
                  <div className="relative">
                    <Image
                      src={car.image || "/placeholder.svg"}
                      alt={car.title}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full"
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="text-xl font-semibold mb-2">{car.title}</h3>
                    <p className="text-2xl font-bold text-primary mb-2">${car.price.toLocaleString()}</p>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{car.location}</span>
                      <span>{car.km.toLocaleString()} km</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/cars/${car.id}`}>{t("featuredCars.viewDetails")}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-10 text-center">
          <Button variant="outline" asChild>
            <Link href="/cars">{t("featuredCars.viewAllCars")}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

