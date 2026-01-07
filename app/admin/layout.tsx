"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageToggle } from "@/components/LanguageToggle"
import { useI18n } from "@/contexts/I18nContext"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (status === "loading") {
    return <LoadingSpinner />
  }

  if (!session) {
    router.push("/login")
    return null
  }

  const user = session.user as any
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin" className="text-xl font-bold dark:text-white">
                  QRFleet
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/admin/viaturas"
                  className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {t("nav.vehicles")}
                </Link>
                <Link
                  href="/admin/documentos"
                  className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {t("nav.documents")}
                </Link>
                <Link
                  href="/admin/eventos"
                  className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {t("nav.events")}
                </Link>
                <Link
                  href="/admin/perfil"
                  className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {t("nav.profile")}
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin/utilizadores"
                    className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    {t("nav.users")}
                  </Link>
                )}
              </div>
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
                className="hidden sm:flex"
                onClick={() => {
                  signOut({ callbackUrl: "/login" })
                }}
              >
                {t("nav.logout")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile menu - Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop - only covers content below navbar */}
            <div
              className="fixed top-16 left-0 right-0 bottom-0 bg-black/50 z-40 sm:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu Panel */}
            <div className="fixed top-16 left-0 right-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-lg z-50 sm:hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="px-4 py-4 space-y-1">
                <Link
                  href="/admin/viaturas"
                  className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.vehicles")}
                </Link>
                <Link
                  href="/admin/documentos"
                  className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.documents")}
                </Link>
                <Link
                  href="/admin/eventos"
                  className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.events")}
                </Link>
                <Link
                  href="/admin/perfil"
                  className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.profile")}
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin/utilizadores"
                    className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("nav.users")}
                  </Link>
                )}
                
                {/* Separator */}
                <div className="border-t dark:border-gray-700 my-3" />
                
                {/* User info and logout */}
                <div className="px-3 py-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    {user.name || user.email}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      signOut({ callbackUrl: "/login" })
                    }}
                  >
                    {t("nav.logout")}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </nav>
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

