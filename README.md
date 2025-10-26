## Propósito

O projeto **Cortaqui** é uma aplicação web desenvolvida para uma barbearia, com o objetivo de centralizar, automatizar e otimizar as operações de agendamento, gerenciamento de clientes, barbeiros, serviços e métricas.

## Guia de Instalação e Configuração

### 1) Requisitos
- Node.js 20+
- pnpm 10+
- PostgreSQL 14+

### 2) Baixar e instalar dependências

Baixe os arquivos e rode `pnpm i`

### 3) Variáveis de ambiente
Crie um arquivo `.env` na raiz com as chaves abaixo:
```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
ABACATEPAY_API_KEY=abc_dev_xxx
ABACATEPAY_DEV_MODE=true
ABACATEPAY_WEBHOOK_SECRET=xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000/meus-agendamentos
```
Observações:
- Obtenha as chaves no painel do Clerk.
- `CLERK_WEBHOOK_SECRET` refere-se ao segredo configurado no endpoint de webhook do Clerk.
- Para acessá-lo na instância de desenvolvimento, siga o guia do Clerk que utiliza o ngrok.

### 4) Banco de dados
Gere e aplique as migrações:
```bash
pnpm db:generate
pnpm db:push
```

### 5) Executar localmente
```bash
pnpm run dev
```
O app ficará disponível em `http://localhost:3000` e redirecionará para `/login`.

### 6) Configurar Clerk
- Crie um projeto no Clerk e habilite Email + Password (ou métodos preferidos).
- Em User → Metadata, defina `public_metadata.role` com um de: `ADMIN`, `BARBEIRO`, `CLIENTE`.
- Atualize as chaves `.env` com as chaves do seu projeto.

### 7) Webhook do Clerk com ngrok
1. Exponha a porta local:
```bash
ngrok http 3000
```
2. Copie a URL pública gerada (`https://<subdominio>.ngrok.io`).
3. No Clerk, crie um endpoint de webhook com a URL:
```
https://<subdominio>.ngrok.io/api/webhooks/clerk
```
4. Copie o segredo do webhook e coloque em `CLERK_WEBHOOK_SECRET`.

Eventos sugeridos:
- `user.created`, `user.updated`, `user.deleted`.

### 8) Pagamento

Para o configurar o gateway de pagamento, configure as chaves de api na dashboard da Abacate Pay.

## Tech Stack

O projeto utiliza o T3-stack.

- **Bootstrap**:
    - Inicializado com `create-t3-app`. Documentação: [create.t3.gg](https://create.t3.gg/en/introduction).
    - Estrutura de pastas: [create.t3.gg/folder-structure](https://create.t3.gg/en/folder-structure-app?packages=drizzle%2Ctailwind).
- **Frontend**:
    - **Next.js (15.3.3)**: Renderização server-side, roteamento baseado em arquivos, rotas de API.
    - **React (19.1.0)**: Interface baseada em componentes.
    - **Tanstack React Query (5.83.0)**: Gerenciamento de dados (fetching, caching, mutações).
    - **Tailwind CSS (4.1.10)**: Estilização com classes utilitárias.
    - **Radix UI Components**: Componentes acessíveis (dialog, dropdown, switch, etc.).
    - **Framer Motion (12.18.1)**: Animações.
    - **Sonner (2.0.5)**: Notificações toast.
    - **Lucide React (0.515.0)**, **Tabler Icons (3.34.0)**: Ícones.
    - **OriginUI**: Componente `event-calendar` para visualização de agendamentos no painel admin.
- **Backend**:
    - **Drizzle ORM (0.38.4)**: ORM para PostgreSQL.
    - **Clerk (@clerk/nextjs 6.24.0)**: Autenticação e gerenciamento de usuários.
- **Banco de Dados**:
    - **PostgreSQL**: Banco relacional, esquema definido em `src/server/db/schema.ts`.
- **Ferramentas**:
    - **TypeScript (5.8.3)**: Segurança de tipos.
    - **Zod (3.25.64)**: Validação de esquemas.
    - **ESLint (9.29.0)**, **Prettier (3.5.3)**: Linting e formatação de código.
    - **PostCSS (8.5.5)**, **Tailwind CSS**: Processamento de CSS.
    - **pnpm**: Gerenciamento de pacotes.

### Comandos

Antes de usar comandos comuns, verifique os scripts definidos em `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "check": "next lint && tsc --noEmit",
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "dev": "next dev --turbo",
    "format:check": "prettier --check \\"**/*.{ts,tsx,js,jsx,mdx}\\" --cache",
    "format:write": "prettier --write \\"**/*.{ts,tsx,js,jsx,mdx}\\" --cache",
    "postinstall": "drizzle-kit generate:pg",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "preview": "next build && next start",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  }
}
```

### Endpoints

- `/login`: Página de login (componente: `login-form.tsx`).
- `/meus-agendamentos`: Lista de agendamentos do cliente (futuros e históricos).
- `/agendar`: Fluxo de agendamento para clientes.
- `/barbeiro/agenda`: Agenda diária/semanal do barbeiro.
- `/barbeiro/historico-servicos`: Histórico de serviços realizados pelo barbeiro.
- `/admin/dashboard`: Painel com métricas gerais.
- `/admin/relatorios`: Visualização de métricas.
- `/admin/agendamentos`: Gerenciamento de agendamentos.
- `/admin/clientes`: Gerenciamento de clientes.
- `/admin/barbeiros`: Gerenciamento de barbeiros.
- `/admin/servicos`: Gerenciamento de serviços.
- `/admin/disponibilidade`: Gerenciamento de disponibilidade de barbeiros.

