"use client"

import { useI18n } from "@/contexts/I18nContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe, Check } from "lucide-react"

const languages = [
  { code: "pt" as const, name: "Português", flag: "🇵🇹", short: "PT" },
  { code: "en" as const, name: "English", flag: "🇬🇧", short: "EN" },
  { code: "es" as const, name: "Español", flag: "🇪🇸", short: "ES" },
  { code: "fr" as const, name: "Français", flag: "🇫🇷", short: "FR" },
]

export function LanguageToggle() {
  const { locale, setLocale } = useI18n()
  const currentLang = languages.find((l) => l.code === locale) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="hidden sm:inline-flex items-center gap-1">
            <span>{currentLang.flag}</span>
            <span className="font-medium">{currentLang.short}</span>
          </span>
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={locale === lang.code ? "bg-accent" : ""}
          >
            <span className="mr-2">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {locale === lang.code && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

