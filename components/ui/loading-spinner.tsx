"use client"

import { useI18n } from "@/contexts/I18nContext"

export function LoadingSpinner() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t("common.loading")}</p>
      </div>
    </div>
  )
}

export function LoadingSpinnerSmall() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative w-8 h-8">
        <div className="absolute top-0 left-0 w-full h-full border-2 border-gray-200 dark:border-gray-700 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )
}

