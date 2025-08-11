import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { mockRelatorioAdmin } from "~/lib/mock-data"
import { SectionCards } from "~/components/section-cards"
import { ChartAreaInteractive } from "~/components/chart-interactive-area"

export default function Page() {
  // TODO: Buscar dados de /api/admin/relatorios
  const relatorio = mockRelatorioAdmin

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Cards de Métricas usando SectionCards */}
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>

            {/* Próximos Agendamentos */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Próximos Agendamentos</CardTitle>
                <CardDescription>Agendamentos para hoje</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">Maria Costa - Corte Masculino</p>
                      <p className="text-sm text-muted-foreground">10:00 - Carlos Santos</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">José Ferreira - Corte + Barba</p>
                      <p className="text-sm text-muted-foreground">14:30 - Pedro Oliveira</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}
