"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useI18n } from "@/contexts/I18nContext"

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityLabel: string
  identifier?: string
  onConfirm: () => Promise<void> | void
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  entityLabel,
  identifier,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const { t } = useI18n()
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setValue("")
      setLoading(false)
    }
  }, [open])

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const requiredWord = "EXCLUIR"
  const disabled = value !== requiredWord || loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("delete.confirmTitle")}</DialogTitle>
          <DialogDescription>
            {t("delete.confirmDescription")
              .replace("{entity}", entityLabel)
              .replace("{identifier}", identifier || "")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("delete.confirmInstruction")} <span className="font-mono font-semibold">{requiredWord}</span>
          </p>
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder={requiredWord}
          />
        </div>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={disabled}
          >
            {loading ? t("form.uploading") : t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


