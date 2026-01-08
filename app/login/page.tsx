"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        console.error("Login error:", result.error)
        toast({
          title: "Erro",
          description: result.error === "CredentialsSignin" 
            ? "Email ou senha incorretos" 
            : `Erro: ${result.error}`,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (result?.ok) {
        // Aguardar um pouco para garantir que a sessão foi criada no servidor
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Verificar se a sessão foi criada corretamente
        const session = await getSession()
        
        if (session) {
          // Forçar reload completo da página para garantir que a sessão seja lida corretamente
          // Isso resolve o problema de a sessão não estar disponível imediatamente após o login
          window.location.href = "/admin"
        } else {
          // Se ainda não houver sessão, tentar novamente após um pequeno delay
          await new Promise(resolve => setTimeout(resolve, 300))
          const retrySession = await getSession()
          
          if (retrySession) {
            window.location.href = "/admin"
          } else {
            toast({
              title: "Erro",
              description: "Sessão não foi criada. Tente novamente.",
              variant: "destructive",
            })
            setLoading(false)
          }
        }
      } else {
        console.warn("Login result unexpected:", result)
        toast({
          title: "Erro",
          description: "Resposta inesperada do servidor",
          variant: "destructive",
        })
        setLoading(false)
      }
    } catch (error) {
      console.error("Login exception:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao fazer login",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <Card className="w-full max-w-md dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl dark:text-white">QRFleet - Login</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

