import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
      <h1 className="text-4xl font-bold tracking-tight">Página não encontrada</h1>
      <p className="mt-3 text-muted-foreground">A página que você procura não existe ou foi movida.</p>
      <Link href="/" className="mt-6 inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition-colors">Voltar para o início</Link>

    </div>
  )
}
