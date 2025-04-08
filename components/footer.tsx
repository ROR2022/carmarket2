"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useTranslation } from "@/utils/translation-context";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">{t("common.appName")}</h3>
            <p className="text-slate-300 mb-4">{t("footer.description")}</p>
            <div className="flex space-x-4">
              <Link href="#" className="text-slate-300 hover:text-white">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-slate-300 hover:text-white">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-slate-300 hover:text-white">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-slate-300 hover:text-white">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/cars" className="text-slate-300 hover:text-white">
                  {t("footer.browseCars")}
                </Link>
              </li>
              <li>
                <Link href="/sell" className="text-slate-300 hover:text-white">
                  {t("footer.sellYourCar")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-300 hover:text-white">
                  {t("footer.aboutUs")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("footer.support")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-slate-300 hover:text-white">
                  {t("footer.faq")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-300 hover:text-white">
                  {t("footer.termsOfService")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-slate-300 hover:text-white"
                >
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-slate-300 hover:text-white"
                >
                  {t("footer.cookies")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("footer.contact")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/contact"
                  className="text-slate-300 hover:text-white"
                >
                  {t("footer.contactUs")}
                </Link>
              </li>
              <li>
                <address className="not-italic text-slate-300">
                  <p>{t("footer.address.street")}</p>
                  <p>{t("footer.address.city")}</p>
                  <p className="mt-2">{t("footer.address.email")}</p>
                  <p>{t("footer.address.phone")}</p>
                </address>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} {t("common.appName")}.{" "}
            {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
