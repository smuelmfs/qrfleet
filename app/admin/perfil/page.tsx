"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/contexts/I18nContext"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { User } from "lucide-react"

export default function PerfilPage() {
  const { data: session, status, update } = useSession()
  const { t } = useI18n()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    newPassword: "",
    confirmPassword: "",
  })

  if (status === "loading") {
    return <LoadingSpinner />
  }

  if (!session) {
    return null
  }

  const user = session.user as any
  
  useEffect(() => {
    if (user) {
      // Se não houver nome, usar primeira parte do email
      const defaultName = user.name || user.email.split("@")[0]
      setFormData({
        name: defaultName,
        newPassword: "",
        confirmPassword: "",
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar senha se foi preenchida
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.newPassword || !formData.confirmPassword) {
        toast({
          title: t("profile.error"),
          description: t("profile.fillBothPasswords"),
          variant: "destructive",
        })
        return
      }

      if (formData.newPassword !== formData.confirmPassword) {
        toast({
          title: t("profile.error"),
          description: t("profile.passwordsDoNotMatch"),
          variant: "destructive",
        })
        return
      }

      if (formData.newPassword.length < 6) {
        toast({
          title: t("profile.error"),
          description: t("profile.passwordMinLength"),
          variant: "destructive",
        })
        return
      }
    }

    setLoading(true)
    try {
      const updateData: any = {
        name: formData.name,
      }

      // Só atualizar senha se foi preenchida
      if (formData.newPassword) {
        updateData.password = formData.newPassword
      }

      const res = await fetch(`/api/utilizadores/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (res.ok) {
        toast({
          title: t("profile.success"),
          description: formData.newPassword 
            ? t("profile.profileUpdatedWithPassword")
            : t("profile.profileUpdated"),
        })
        setFormData((prev) => ({
          name: prev.name,
          newPassword: "",
          confirmPassword: "",
        }))
        // Atualizar sessão para refletir mudanças de nome no layout/navbar
        if (update) {
          await update({ name: formData.name })
        }
      } else {
        const error = await res.json()
        toast({
          title: t("profile.error"),
          description: error.error || t("profile.updateError"),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("profile.error"),
        description: t("profile.updateError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">{t("profile.title")}</h1>
      </div>

      <div className="max-w-2xl">
        <Card className="dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-2">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              {t("profile.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
              {t("profile.userInfoDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("users.name")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.nameHint")}
                </p>
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">{t("users.email")}</Label>
                <p className="text-gray-900 dark:text-white font-medium mt-1">
                  {user.email}
                </p>
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">{t("users.role")}</Label>
                <p className="text-gray-900 dark:text-white font-medium mt-1">
                  {user.role === "ADMIN" ? t("users.admin") : t("users.editor")}
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {t("profile.changePassword")}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  {t("profile.changePasswordDesc")}
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">{t("profile.newPassword")}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("profile.passwordMinLength")} {t("profile.passwordOptional")}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">{t("profile.confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    minLength={formData.newPassword ? 6 : undefined}
                    disabled={!formData.newPassword}
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? t("form.uploading") : t("profile.updateProfile")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

