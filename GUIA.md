## Guia de Instalação e Configuração (Cortaqui)

Este guia descreve como preparar o ambiente, configurar variáveis, iniciar o banco de dados, integrar o Clerk e expor o webhook via ngrok.

### 1) Requisitos
- Node.js 20+
- pnpm 10+
- PostgreSQL 14+

### 2) Baixar e instalar

Baixe os arquivos e rode `pnpm i`

### 3) Variáveis de ambiente
Crie um arquivo `.env.local` na raiz com as chaves abaixo:
```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
```

Observações:
- Obtenha as chaves no painel do Clerk.
- `CLERK_WEBHOOK_SECRET` refere-se ao segredo configurado no endpoint de webhook do Clerk (via Svix).

### 4) Banco de dados (Drizzle)
Gere e aplique as migrações:
```bash
pnpm db:generate
pnpm db:migrate
```

### 5) Executar localmente
```bash
pnpm dev
```
O app ficará disponível em `http://localhost:3000` e redirecionará para `/login`.

### 6) Configurar Clerk
- Crie um projeto no Clerk e habilite Email + Password (ou métodos preferidos).
- Em User → Metadata, defina `public_metadata.role` com um de: `ADMIN`, `BARBEIRO`, `CLIENTE`.
- Atualize as chaves `.env.local` com as chaves do seu projeto.

### 7) Webhook do Clerk (Svix) com ngrok
1. Exponha a porta local:
```bash
ngrok http 3000
```
2. Copie a URL pública gerada (`https://<subdominio>.ngrok.io`).
3. No Clerk, crie um endpoint de webhook com a URL:
```
https://<subdominio>.ngrok.io/api/webhooks/clerk
```
4. Copie o segredo do webhook (Svix) e coloque em `CLERK_WEBHOOK_SECRET`.

Eventos sugeridos:
- `user.created`, `user.updated`, `user.deleted`.

### 8) Permissões e RBAC
As verificações de permissão estão em `src/lib/auth.ts`. O papel do usuário é lido de `public_metadata.role`. Padrão: `CLIENTE`.

### 9) Endpoints principais
Conforme `README.md`, os handlers foram criados em `src/app/api/*`. Muitos endpoints estão como esqueleto (501) e devem ser completados conforme a regra de negócio.

### 10) Problemas comuns
- 401/403: verifique login no Clerk e `public_metadata.role`.
- 400 no webhook: confirme `CLERK_WEBHOOK_SECRET` e cabeçalhos Svix.
- DB: confirme `DATABASE_URL` e se as migrações foram aplicadas.
