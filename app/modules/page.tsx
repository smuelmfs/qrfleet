"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Users, ArrowRight } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageToggle } from "@/components/LanguageToggle"
import { signOut } from "next-auth/react"
import { useI18n } from "@/contexts/I18nContext"

export default function ModulesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useI18n()

  if (status === "loading") {
    return <LoadingSpinner />
  }

  if (!session) {
    router.push("/login")
    return null
  }

  const user = session.user as any

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold dark:text-white">{t("modules.title")}</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle />
              <span className="hidden lg:inline text-sm text-gray-700 dark:text-gray-300">
                {user.name || user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  signOut({ callbackUrl: "/login" })
                }}
              >
                {t("nav.logout")}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t("modules.available")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t("modules.select")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {}
          <Card className="dark:bg-gray-800 hover:shadow-lg transition-shadow cursor-pointer group">
            <Link href="/module-equipament/admin">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </div>
                <CardTitle className="mt-4 dark:text-white">{t("modules.equipment.title")}</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  {t("modules.equipment.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("modules.equipment.details")}
                </p>
              </CardContent>
            </Link>
          </Card>

          {}
          <Card className="dark:bg-gray-800 opacity-50 cursor-not-allowed">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-medium text-gray-600 dark:text-gray-400">
                  {t("modules.unavailable")}
                </div>
              </div>
              <CardTitle className="mt-4 dark:text-white">{t("modules.people.title")}</CardTitle>
              <CardDescription className="dark:text-gray-400">
                {t("modules.people.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {t("modules.unavailable.message")}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

