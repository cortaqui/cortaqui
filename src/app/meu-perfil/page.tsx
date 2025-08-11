"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { User, Phone, Mail, Save } from 'lucide-react'

export default function MeuPerfilPage() {
  // TODO: Buscar dados do usuário logado via Clerk
  const [nome, setNome] = useState("Maria Costa")
  const [telefone, setTelefone] = useState("(11) 66666-6666")
  const [email, setEmail] = useState("maria@email.com")
  const [loading, setLoading] = useState(false)

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Enviar para /api/usuario/perfil
    console.log("Salvando perfil:", { nome, telefone, email })
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Mantenha seus dados atualizados para melhor atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10"
                  required
                  disabled // Email gerenciado pelo Clerk
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O email é gerenciado pelo sistema de autenticação
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
          <CardDescription>Seu histórico na Cortaqui</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-muted-foreground">Serviços Realizados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">R$ 420,00</div>
              <div className="text-sm text-muted-foreground">Total Gasto</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">6 meses</div>
              <div className="text-sm text-muted-foreground">Cliente desde</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
