"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, ArrowRight, Check, Upload, X } from "lucide-react"
import Link from "next/link"

export default function NovoEquipamentoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)

  const [formData, setFormData] = useState({
    tipo: "VEICULO",
    matricula: "",
    parque: "",
    modelo: "",
    marca: "",
    ano: "",
    foto: "",
    descricao: "",
  })

  const totalSteps = 3

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "Arquivo muito grande. Tamanho máximo: 3MB",
        variant: "destructive",
      })
      return
    }
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Apenas imagens são permitidas",
        variant: "destructive",
      })
      return
    }
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }

  const validateStep = (stepNumber: number): boolean => {
    if (stepNumber === 1) {
      if (formData.tipo === "VEICULO" && !formData.matricula.trim()) {
        toast({
          title: "Erro",
          description: "Matrícula é obrigatória para veículos",
          variant: "destructive",
        })
        return false
      }
      if (formData.tipo === "MAQUINA" && !formData.parque.trim()) {
        toast({
          title: "Erro",
          description: "Parque é obrigatório para máquinas",
          variant: "destructive",
        })
        return false
      }
    }
    if (stepNumber === 2) {
      if (!formData.marca.trim()) {
        toast({
          title: "Erro",
          description: "Marca é obrigatória",
          variant: "destructive",
        })
        return false
      }
      if (!formData.modelo.trim()) {
        toast({
          title: "Erro",
          description: "Modelo é obrigatório",
          variant: "destructive",
        })
        return false
      }
      if (!formData.ano.trim()) {
        toast({
          title: "Erro",
          description: "Ano é obrigatório",
          variant: "destructive",
        })
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(step)) return

    try {
      setLoading(true)
      let fotoUrl = formData.foto

      if (selectedFile) {
        setUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append("file", selectedFile)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadRes.ok) {
          const error = await uploadRes.json()
          toast({
            title: "Erro",
            description: error.error || "Erro ao fazer upload da imagem",
            variant: "destructive",
          })
          setUploading(false)
          setLoading(false)
          return
        }

        const { url } = await uploadRes.json()
        fotoUrl = url
        setUploading(false)
      }

      const res = await fetch("/api/viaturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, foto: fotoUrl }),
      })

      if (res.ok) {
        const data = await res.json()
        toast({
          title: "Sucesso",
          description: "Equipamento criado com sucesso",
        })
        router.push(`/module-equipament/admin/equipment/${data.id}`)
      } else {
        const error = await res.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao criar equipamento",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar equipamento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/module-equipament/admin/equipment">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        <Card className="shadow-lg dark:bg-gray-800">
          <CardHeader className="border-b dark:border-gray-700">
            <CardTitle className="text-2xl">Cadastro de Novo Equipamento</CardTitle>
            <CardDescription className="text-base mt-2">
              Preencha as informações do equipamento passo a passo
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Progress Steps - Melhorado */}
            <div className="mb-10">
              <div className="flex items-center justify-between relative">
                {/* Linha de fundo */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
                <div 
                  className="absolute top-5 left-0 h-0.5 bg-blue-600 z-10 transition-all duration-300"
                  style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                />
                
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="relative z-20 flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        step >= stepNumber
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-110"
                          : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400"
                      }`}
                    >
                      {step > stepNumber ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="font-semibold">{stepNumber}</span>
                      )}
                    </div>
                    <div className={`mt-3 text-xs text-center font-medium max-w-[120px] ${
                      step >= stepNumber 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {stepNumber === 1 && "Tipo e Identificação"}
                      {stepNumber === 2 && "Informações Básicas"}
                      {stepNumber === 3 && "Foto e Descrição"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          {/* Step 1: Tipo e Identificação */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                  Tipo e Identificação
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Primeiro, identifique o tipo de equipamento e seu identificador único
                </p>
              </div>
              <div className="space-y-6">
                  <div className="grid gap-2">
                    <Label htmlFor="tipo">Tipo de Equipamento *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) =>
                        setFormData({ ...formData, tipo: value, matricula: "", parque: "" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VEICULO">Veículo</SelectItem>
                        <SelectItem value="MAQUINA">Máquina</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Selecione se é um veículo ou uma máquina
                    </p>
                  </div>

                  {formData.tipo === "VEICULO" ? (
                    <div className="grid gap-2">
                      <Label htmlFor="matricula">Matrícula *</Label>
                      <Input
                        id="matricula"
                        value={formData.matricula}
                        onChange={(e) =>
                          setFormData({ ...formData, matricula: e.target.value })
                        }
                        placeholder="Ex: AB-12-CD"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Matrícula do veículo (obrigatória)
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label htmlFor="parque">Parque *</Label>
                      <Input
                        id="parque"
                        value={formData.parque}
                        onChange={(e) =>
                          setFormData({ ...formData, parque: e.target.value })
                        }
                        placeholder="Ex: MAQ-001"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Número de parque da máquina (obrigatório)
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Step 2: Informações Básicas */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg mb-6">
                <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-1">
                  Informações Básicas
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Preencha os dados principais do equipamento
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="marca" className="text-sm font-semibold">Marca *</Label>
                  <Input
                    id="marca"
                    value={formData.marca}
                    onChange={(e) =>
                      setFormData({ ...formData, marca: e.target.value })
                    }
                    placeholder="Ex: Toyota, Caterpillar"
                    className="h-11"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="modelo" className="text-sm font-semibold">Modelo *</Label>
                  <Input
                    id="modelo"
                    value={formData.modelo}
                    onChange={(e) =>
                      setFormData({ ...formData, modelo: e.target.value })
                    }
                    placeholder="Ex: Corolla, 320D"
                    className="h-11"
                    required
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="ano" className="text-sm font-semibold">Ano *</Label>
                  <Input
                    id="ano"
                    type="number"
                    value={formData.ano}
                    onChange={(e) =>
                      setFormData({ ...formData, ano: e.target.value })
                    }
                    placeholder="Ex: 2020"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="h-11"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Foto e Descrição */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded-r-lg mb-6">
                <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                  Foto e Descrição
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Adicione uma foto e informações adicionais sobre o equipamento
                </p>
              </div>
              <div className="space-y-6">
                  <div className="grid gap-2">
                    <Label htmlFor="foto">Foto do Equipamento</Label>
                    {preview ? (
                      <div className="relative">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full max-w-md h-64 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setSelectedFile(null)
                            setPreview("")
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          isDragging
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                        }`}
                      >
                        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm font-medium mb-2">
                          {isDragging ? "Solte a imagem aqui" : "Arraste e solte a imagem aqui"}
                        </p>
                        <p className="text-xs text-gray-500 mb-4">ou</p>
                        <Input
                          id="foto"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Label
                          htmlFor="foto"
                          className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Selecionar imagem
                        </Label>
                        <p className="text-xs text-gray-500 mt-2">
                          Tamanho máximo: 3MB. Formatos: JPG, PNG, WEBP
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Informações adicionais sobre o equipamento (opcional)"
                    />
                    <p className="text-xs text-gray-500">
                      Adicione informações adicionais sobre o equipamento
                    </p>
                  </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t dark:border-gray-700">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 1}
              size="lg"
              className="min-w-[120px]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Passo {step} de {totalSteps}
            </div>
            {step < totalSteps ? (
              <Button onClick={handleNext} size="lg" className="min-w-[120px]">
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading || uploading}
                size="lg"
                className="min-w-[160px] bg-green-600 hover:bg-green-700"
              >
                {loading || uploading ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Finalizar Cadastro
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

