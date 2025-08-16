## Propósito

O projeto **Cortaqui** é uma aplicação web desenvolvida para a Barbearia Tradição do Boleiro, com o objetivo de centralizar, automatizar e otimizar as operações de agendamento, gerenciamento de clientes, barbeiros, serviços e relatórios. A solução visa melhorar a eficiência operacional, proporcionar uma experiência fluida para clientes, barbeiros e administradores, e garantir escalabilidade para futuras expansões.

## Escopo

O sistema abrange três módulos principais:

- **Módulo Cliente**:
    - Cadastro e login.
    - Edição de perfil.
    - Visualização de serviços e preços.
    - Agendamento online.
    - Visualização de histórico de agendamentos e agendamentos futuros.
    - Cancelamento de agendamentos (com regras de negócio).
    - Pagamento online pós-serviço.
    - Recebimento de notificações no sistema.
- **Módulo Barbeiro**:
    - Login.
    - Edição de perfil.
    - Visualização de agenda (diária/semanal).
    - Visualização de histórico de serviços.
- **Módulo Administrador**:
    - Login.
    - CRUD de barbeiros, clientes e serviços (com preço base e por barbeiro).
    - Gestão de disponibilidade e agenda dos barbeiros.
    - Visualização de relatórios de faturamento e operações.
- **Funcionalidades do Sistema**:
    - Prevenção de agendamentos duplicados.
    - Notificações automáticas no sistema.
    - Armazenamento de histórico de pagamentos.
    - Autenticação segura via Clerk.
    - Responsividade para dispositivos móveis (PWA).
    - Integração com API de pagamento (PagSeguro).

### Fora do Escopo

- Aplicativo móvel nativo (a solução será uma Progressive Web App).
- Suporte offline.
- Programas de fidelidade ou promoções complexas.
- Agendamento por clientes não cadastrados (guest checkout).
- Gerenciamento de estoque.
- Pagamento em dinheiro.

## Tech Stack

O projeto utiliza a stack T3 para garantir robustez, escalabilidade e produtividade no desenvolvimento.

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
    - **OriginUI (futuro)**: Componente `event-calendar` para visualização de agendamentos no painel admin.
- **Backend**:
    - **Drizzle ORM (0.38.4)**: ORM para PostgreSQL.
    - **Clerk (@clerk/nextjs 6.24.0)**: Autenticação e gerenciamento de usuários.
    - **PagSeguro API**: Processamento de pagamentos.
- **Banco de Dados**:
    - **PostgreSQL**: Banco relacional, esquema definido em `src/server/db/schema.ts`.
- **Ferramentas**:
    - **TypeScript (5.8.3)**: Segurança de tipos.
    - **Zod (3.25.64)**: Validação de esquemas.
    - **ESLint (9.29.0)**, **Prettier (3.5.3)**: Linting e formatação de código.
    - **PostCSS (8.5.5)**, **Tailwind CSS**: Processamento de CSS.
    - **pnpm**: Gerenciamento de pacotes.

## Esquema do Banco

O banco de dados é estruturado em PostgreSQL com as seguintes entidades e relações, conforme o diagrama ER (estilo Martin):

- **Usuario**:
    - `user_id` (UUID, PK): Identificador único.
    - `nome` (VARCHAR(100), obrigatório): Nome do usuário.
    - `email` (VARCHAR(150), UK): E-mail único.
    - `telefone` (VARCHAR(20)): Telefone.
    - `hash_senha` (VARCHAR(150)): Senha criptografada.
    - `tipo_usuario` (ENUM: 'cliente', 'barbeiro', 'admin'): Tipo de usuário.
    - `data_cadastro` (TIMESTAMP): Data de criação.
- **Servico**:
    - `servico_id` (UUID, PK): Identificador único.
    - `nome` (VARCHAR(100), obrigatório): Nome do serviço.
    - `descricao` (TEXT): Descrição do serviço.
    - `duracao_minutos` (INT, obrigatório): Duração em minutos.
    - `preco_base` (DECIMAL(10,2), obrigatório): Preço base.
    - `ativo` (BOOLEAN): Status do serviço.
- **Servico_Barbeiro**:
    - `barbeiro_user_id` (UUID, PK, FK -> Usuario): ID do barbeiro.
    - `servico_id` (UUID, PK, FK -> Servico): ID do serviço.
    - `preco_especifico` (DECIMAL(10,2)): Preço específico do barbeiro.
- **Agendamento**:
    - `agendamento_id` (UUID, PK): Identificador único.
    - `cliente_user_id` (UUID, FK -> Usuario): ID do cliente.
    - `barbeiro_user_id` (UUID, FK -> Usuario): ID do barbeiro.
    - `servico_id` (UUID, FK -> Servico): ID do serviço.
    - `data_hora_inicio` (TIMESTAMP, obrigatório): Início do agendamento.
    - `data_hora_fim` (TIMESTAMP, obrigatório): Fim do agendamento.
    - `status` (ENUM: 'pendente', 'confirmado', 'cancelado', 'concluido'): Status.
    - `observacoes_cliente` (TEXT): Observações do cliente.
    - `valor_cobrado` (DECIMAL(10,2)): Valor cobrado.
- **Pagamento**:
    - `pagamento_id` (UUID, PK): Identificador único.
    - `agendamento_id` (UUID, FK, UK): ID do agendamento.
    - `id_transacao_gateway` (VARCHAR(255)): ID da transação no gateway.
    - `status` (ENUM: 'pendente', 'aprovado', 'rejeitado'): Status do pagamento.
    - `valor` (DECIMAL(10,2), obrigatório): Valor pago.
    - `data_pagamento` (TIMESTAMP): Data do pagamento.
    - `metodo` (VARCHAR(50)): Método de pagamento.
- **Nota_Fiscal**:
    - `nota_fiscal_id` (UUID, PK): Identificador único.
    - `pagamento_id` (UUID, FK, UK): ID do pagamento.
    - `numero` (VARCHAR(100)): Número da nota.
    - `chave_acesso` (VARCHAR(255), UK): Chave de acesso.
    - `xml_url` (VARCHAR(512)): URL do XML da nota.
    - `pdf_url` (VARCHAR(512)): URL do PDF da nota.
    - `data_emissao` (TIMESTAMP, obrigatório): Data de emissão.
    - `status` (ENUM: 'emitida', 'cancelada', 'erro'): Status da nota.
- **Disponibilidade**:
    - `disponibilidade_id` (UUID, PK): Identificador único.
    - `admin_user_id` (UUID, FK -> Usuario): ID do administrador.
    - `barbeiro_user_id` (UUID, FK -> Usuario): ID do barbeiro.
    - `dia_semana` (ENUM: 'seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'): Dia da semana.
    - `hora_inicio` (TIME, obrigatório): Hora de início.
    - `hora_fim` (TIME, obrigatório): Hora de fim.
    - `tipo` (ENUM: 'trabalho', 'bloqueio'): Tipo de disponibilidade.
    - `data_especifica` (DATE): Data específica (opcional).

### Relacionamentos

- **Usuario** 1:N **Agendamento** (realiza como cliente, executa como barbeiro).
- **Servico** 1:N **Agendamento** (referente a).
- **Agendamento** 1:1 **Pagamento** (gera).
- **Pagamento** 1:1 **Nota_Fiscal** (resulta em).
- **Usuario** 1:N **Disponibilidade** (define como admin, aplica a barbeiro).
- **Usuario** N:N **Servico** via **Servico_Barbeiro** (oferece).

## Data Flows

Os fluxos de dados descrevem como as informações circulam entre os componentes do sistema:

1. **Autenticação**:
    - Usuário (Cliente, Barbeiro, Admin) faz login via Clerk.
    - Clerk autentica e retorna um token JWT, armazenado no cliente.
    - O token é usado para acessar rotas protegidas.
2. **Agendamento (Cliente)**:
    - Cliente acessa `/agendar`, solicita serviços (`GET /api/servicos`).
    - Escolhe serviço, solicita disponibilidade (`GET /api/disponibilidade`).
    - Seleciona barbeiro e horário, envia `POST /api/agendamentos`.
    - Backend valida (duplicidade, disponibilidade), insere no banco e retorna confirmação.
3. **Agendamento (Admin)**:
    - Admin acessa `/admin/agendamentos`, cria ou busca cliente (`POST /api/admin/clientes`).
    - Seleciona serviço, barbeiro e horário, envia `POST /api/agendamentos`.
    - Backend valida e insere no banco.
4. **Pagamento**:
    - Após serviço concluído, cliente acessa `/agendar/pagamento/:idAgendamento`.
    - Envia `POST /api/pagamentos` com dados do pagamento.
    - Backend integra com PagSeguro, registra pagamento e emite nota fiscal.
5. **Relatórios (Admin)**:
    - Admin acessa `/admin/relatorios/faturamento`.
    - Backend executa query agregada no banco (`Agendamento`, `Pagamento`) e retorna dados.

## User Journeys

### Jornada do Cliente

1. **Login**: Acessa `/login`, insere credenciais, autenticado via Clerk.
2. **Explorar Serviços**: Navega para `/agendar`, visualiza serviços e preços.
3. **Agendar**: Seleciona serviço, barbeiro e horário, confirma agendamento.
4. **Gerenciar Agendamentos**: Em `/meus-agendamentos`, visualiza agendamentos futuros e históricos, com opção de cancelar (se permitido).
5. **Pagar**: Após serviço, acessa `/agendar/pagamento/:id`, realiza pagamento via PagSeguro.
6. **Editar Perfil**: Em `/meu-perfil`, atualiza nome, telefone ou senha.

### Jornada do Barbeiro

1. **Login**: Acessa `/login`, autenticado via Clerk.
2. **Visualizar Agenda**: Em `/barbeiro/agenda`, vê agendamentos diários/semanais.
3. **Histórico de Serviços**: Em `/barbeiro/historico-servicos`, consulta serviços realizados.
4. **Editar Perfil**: Em `/meu-perfil`, atualiza informações pessoais.

### Jornada do Administrador

1. **Login**: Acessa `/login`, autenticado via Clerk.
2. **Dashboard**: Em `/admin/dashboard`, visualiza métricas gerais.
3. **Gerenciar Entidades**: Em `/admin/clientes`, `/admin/barbeiros`, `/admin/servicos`, realiza operações CRUD.
4. **Gerenciar Disponibilidade**: Em `/admin/disponibilidade`, define horários de trabalho ou bloqueios.
5. **Relatórios**: Em `/admin/relatorios`, visualiza faturamento e operações.
6. **Agendamentos**: Em `/admin/agendamentos`, cria ou gerencia agendamentos.

## Melhores Práticas de Desenvolvimento

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

### Organização do Código

- Use roteamento baseado em arquivos do Next.js em `src/app` para páginas e `src/app/api` para rotas de API.
- Centralize consultas ao banco em `src/server/db/queries.ts` (server-only).
- Agrupe componentes por funcionalidade (ex.: `src/components/agendamento`).
- Utilize TypeScript para segurança de tipos.
- Crie funções manipuladoras (handlers) para formulários e cliques ao invés de utilizar useEffects.
- Siga a filosofia Unix: componentes devem fazer uma coisa bem feita. Evite componentes complexos.
- Geralmente procure seguir as regras do ESLint.

### Gerenciamento de Dados

- Use Server Components para pré-carregar dados, passando para o React Query.
- Utilize `useQuery` para buscas e `useMutation` para atualizações.
- Defina chaves de query em `src/lib/query-keys.ts` para consistência de cache.
- Invalide queries após mutações para sincronizar a UI.

### Gerenciamento de Estado

- Minimize o uso de `useEffect`; prefira React Query para UI orientada a dados.
- Derive estados sempre que possível, evitando criar novos estados.
- Use `useRef` para foco em inputs ou interações com o DOM.

### Segurança

- Use Clerk para autenticação e verifique sessões em rotas de API.
- Implemente RBAC (Role-Based Access Control) com `hasPermission` em `src/lib/auth.ts`.
- Valide entradas com Zod em rotas de API.

### UI/UX

- Use Tailwind CSS e Radix UI para uma interface consistente e acessível.
- Exiba notificações via toasts (`components/ui/sonner.tsx`) para feedback ao usuário.
- Garanta responsividade com o hook `use-mobile.ts`.

### Performance

- Configure `staleTime`/`cacheTime` no React Query para caching eficiente.
- Carregue histórico de agendamentos e imagens sob demanda (lazy-load).
- Comprima arquivos enviados para o storage.

### Tratamento de Erros

- Use error boundaries globais no `QueryClient`.
- Retorne mensagens de erro significativas em respostas de API.
- Exiba erros via toasts.

## Política de Versionamento (Git)

Git é um sistema de controle de versão que permite rastrear alterações no código, colaborar com outros desenvolvedores e reverter mudanças, se necessário.

- **Repositório**: O projeto Cortaqui está em um repositório Git, hospedado (https://www.github.com/cortaqui/cortaqui). Ele contém todo o código, histórico de alterações e branches.
- **Commits**: Cada alteração no código é salva como um "commit", com uma mensagem descritiva (ex.: "Adiciona modal de agendamento").
- **Branches**: São ramificações do código principal, usadas para desenvolver funcionalidades isoladamente.

## Endpoints & Arquivos

### Endpoints

Os endpoints são organizados em rotas de interface (páginas) e rotas de API (route handlers).

### Rotas de Interface

- `/login`: Página de login (componente: `login-form.tsx`).
- `/logout`: Finaliza a sessão do usuário.
- `/meu-perfil`: Edição de perfil do usuário (Cliente/Barbeiro/Admin).
- `/meus-agendamentos`: Lista de agendamentos do cliente (futuros e históricos).
- `/agendar`: Fluxo de agendamento para clientes.
- `/agendar/pagamento/:idAgendamento`: Página de pagamento de um agendamento.
- `/barbeiro/agenda`: Agenda diária/semanal do barbeiro.
- `/barbeiro/historico-servicos`: Histórico de serviços realizados pelo barbeiro.
- `/admin/dashboard`: Painel com métricas gerais.
- `/admin/relatorios/faturamento`: Relatórios de faturamento.
- `/admin/agendamentos`: Gerenciamento de agendamentos.
- `/admin/clientes`: CRUD de clientes.
- `/admin/clientes/editar/:id`: Edição de cliente específico.
- `/admin/barbeiros`: CRUD de barbeiros.
- `/admin/barbeiros/editar/:id`: Edição de barbeiro específico.
- `/admin/servicos`: CRUD de serviços.
- `/admin/servicos/editar/:id`: Edição de serviço específico.
- `/admin/disponibilidade`: Gerenciamento de disponibilidade de barbeiros.

### Rotas de API

- `GET /api/servicos`: Lista serviços ativos.
- `GET /api/disponibilidade`: Lista horários disponíveis por serviço/barbeiro.
- `GET, POST /api/agendamentos`: Lista ou cria agendamentos.
- `GET, PUT /api/agendamentos/:id`: Detalhes ou edição de agendamento.
- `POST /api/agendamentos/:id/cancelar`: Cancela um agendamento.
- `POST /api/pagamentos`: Processa pagamento via PagSeguro.
- `GET /api/usuarios/:id`: Detalhes de um usuário.
- `GET, POST /api/admin/clientes`: Lista ou cria clientes.
- `GET, PUT, DELETE /api/admin/clientes/:id`: Detalhes, edição ou exclusão de cliente.
- `GET, POST /api/admin/barbeiros`: Lista ou cria barbeiros.
- `GET, PUT, DELETE /api/admin/barbeiros/:id`: Detalhes, edição ou exclusão de barbeiro.
- `GET, POST /api/admin/servicos`: Lista ou cria serviços.
- `GET, PUT, DELETE /api/admin/servicos/:id`: Detalhes, edição ou exclusão de serviço.
- `GET, POST /api/admin/disponibilidade`: Lista ou define disponibilidade.

### Arquivos

- **Configurações**:
    - `drizzle.config.ts`: Configuração do Drizzle ORM.
    - `eslint.config.js`: Regras de linting.
    - `next.config.js`: Configurações do Next.js.
    - `postcss.config.js`: Configurações do PostCSS.
    - `prettier.config.js`: Regras de formatação.
    - `tsconfig.json`: Configurações do TypeScript.
    - `start-database.sh`: Script para iniciar o banco local.
- **Páginas (`src/app`)**:
    - `login/page.tsx`: Página de login.
    - `meu-perfil/page.tsx`: Edição de perfil.
    - `meus-agendamentos/page.tsx`: Lista de agendamentos do cliente.
    - `agendar/page.tsx`: Fluxo de agendamento.
    - `barbeiro/agenda/page.tsx`: Agenda do barbeiro.
    - `barbeiro/historico-servicos/page.tsx`: Histórico de serviços.
    - `admin/dashboard/page.tsx`: Dashboard do administrador.
    - `admin/relatorios/page.tsx`: Relatórios.
    - `admin/agendamentos/page.tsx`: Gerenciamento de agendamentos.
    - `admin/clientes/page.tsx`: Lista de clientes.
    - `admin/barbeiros/page.tsx`: Lista de barbeiros.
    - `admin/servicos/page.tsx`: Lista de serviços.
    - `admin/disponibilidade/page.tsx`: Gerenciamento de disponibilidade.
- **Componentes (`src/components`)**:
    - `app-sidebar.tsx`: Barra lateral da aplicação.
    - `chart-interactive-area.tsx`: Gráficos interativos (usado em relatórios).
    - `data-table.tsx`: Tabela de dados genérica.
    - `login-form.tsx`: Formulário de login.
    - Modais: `ModalAdicionarBarbeiro.tsx`, `ModalAdicionarServico.tsx`, etc.
    - Componentes UI (`src/components/ui`): `avatar.tsx`, `button.tsx`, `calendar.tsx`, etc.
- **Outros**:
    - `src/server/db/index.ts`: Configuração do Drizzle ORM.
    - `src/server/db/schema.ts`: Esquema do banco.
    - `src/hooks/use-mobile.ts`: Hook para responsividade.
    - `src/lib/mock-data.ts`: Dados mock para desenvolvimento.
    - `src/lib/types.ts`: Definições de tipos TypeScript.
    - `src/lib/utils.ts`: Funções utilitárias.
    - `src/styles/globals.css`: Estilos globais.

## Diagramas

### Casos de Uso

```
@startuml
left to right direction
skinparam packageStyle rectangle

actor User
actor Cliente
actor Barbeiro
actor Administrador

Cliente -|> User
Barbeiro -|> User
Administrador -|> User

rectangle "Sistema Cortaqui" {
  usecase "Gerenciar Perfil" as UC_Perfil
  usecase "Autenticar Usuário" as UC_Auth
  usecase "Receber Notificações" as UC_Notificar

  usecase "Visualizar Serviços/Preços" as UC_VerServicos
  usecase "Agendar Horário" as UC_Agendar
  usecase "Visualizar Agendamentos" as UC_VerAgendamentos
  usecase "Cancelar Agendamento" as UC_Cancelar
  usecase "Realizar Pagamento Online" as UC_Pagar

  usecase "Gerenciar Disponibilidade" as UC_Disponibilidade
  usecase "Visualizar Agenda" as UC_VerAgenda
  usecase "Visualizar Histórico Serviços" as UC_HistServicos

  usecase "Gerenciar Barbeiros (CRUD)" as UC_CrudBarbeiro
  usecase "Gerenciar Clientes (CRUD)" as UC_CrudCliente
  usecase "Gerenciar Serviços (CRUD)" as UC_CrudServico
  usecase "Definir Preços" as UC_Precos
  usecase "Visualizar Relatórios" as UC_Relatorios

  usecase "Pagamento" as UC_IntPagamento
}

User -- UC_Perfil
User -- UC_Auth
User -- UC_Notificar

Cliente -- UC_VerServicos
Cliente -- UC_Agendar
Cliente -- UC_VerAgendamentos
Cliente -- UC_Cancelar
Cliente -- UC_Pagar

Barbeiro -- UC_Disponibilidade
Barbeiro -- UC_VerAgenda
Barbeiro -- UC_HistServicos

Administrador -- UC_CrudBarbeiro
Administrador -- UC_CrudCliente
Administrador -- UC_CrudServico
Administrador -- UC_Precos
Administrador -- UC_Disponibilidade
Administrador -- UC_VerAgenda
Administrador -- UC_Relatorios
Administrador -- UC_Agendar

UC_Agendar ..> UC_VerServicos : <<include>>
UC_Agendar ..> UC_Disponibilidade : <<include>>
UC_Pagar ..> UC_IntPagamento : <<include>>

@enduml

```

### Banco (Martin)

```
@startuml DiagramaER_Martin_Unificado

hide circle
skinparam linetype ortho

entity "Usuario" as user {
  *user_id : UUID <<PK>>
  --
  *nome : VARCHAR(100)
  *email : VARCHAR(150) <<UK>>
  *telefone : VARCHAR(20)
  *hash_senha : VARCHAR(150)
  *tipo_usuario : ENUM('cliente', 'barbeiro', 'admin')
  data_cadastro : TIMESTAMP
}

entity "Servico" as service {
  *servico_id : UUID <<PK>>
  --
  *nome : VARCHAR(100)
  descricao : TEXT
  *duracao_minutos : INT
  *preco_base : DECIMAL(10,2)
  *ativo : BOOLEAN
}

entity "Servico_Barbeiro" as barber_service {
  *barbeiro_user_id : UUID <<PK>> <<FK>> {tipo_usuario = barbeiro}
  *servico_id : UUID <<PK>> <<FK>>
  --
  preco_especifico : DECIMAL(10,2)
}

entity "Agendamento" as booking {
  *agendamento_id : UUID <<PK>>
  --
  *cliente_user_id : UUID <<FK>> {tipo_usuario = cliente}
  *barbeiro_user_id : UUID <<FK>> {tipo_usuario = barbeiro}
  *servico_id : UUID <<FK>>
  *data_hora_inicio : TIMESTAMP
  *data_hora_fim : TIMESTAMP
  *status : ENUM('pendente', 'confirmado', 'cancelado', 'concluido')
  observacoes_cliente : TEXT
  valor_cobrado : DECIMAL(10,2)
}

entity "Pagamento" as payment {
  *pagamento_id : UUID <<PK>>
  --
  *agendamento_id : UUID <<FK>> <<UK>>
  id_transacao_gateway : VARCHAR(255)
  *status : ENUM('pendente', 'aprovado', 'rejeitado')
  *valor : DECIMAL(10,2)
  data_pagamento : TIMESTAMP
  metodo : VARCHAR(50)
}

entity "Nota_Fiscal" as invoice {
  *nota_fiscal_id : UUID <<PK>>
  --
  *pagamento_id : UUID <<FK>> <<UK>>
  numero : VARCHAR(100)
  chave_acesso : VARCHAR(255) <<UK>>
  xml_url : VARCHAR(512)
  pdf_url : VARCHAR(512)
  *data_emissao : TIMESTAMP
  *status : ENUM('emitida', 'cancelada', 'erro')
}

entity "Disponibilidade" as availability {
  *disponibilidade_id : UUID <<PK>>
  --
  *admin_user_id : UUID <<FK>> {tipo_usuario = admin}
  *barbeiro_user_id : UUID <<FK>> {tipo_usuario = barbeiro}
  *dia_semana : ENUM('seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom')
  *hora_inicio : TIME
  *hora_fim : TIME
  *tipo : ENUM('trabalho', 'bloqueio')
  data_especifica : DATE
}

' --- Relacionamentos ---

user ||--o{ booking : realiza {tipo_usuario = cliente}
user ||--o{ booking : executa {tipo_usuario = barbeiro}
service ||--o{ booking : referente a

booking ||--o| payment : gera
payment ||--o| invoice : resulta em

user ||--o{ availability : define {tipo_usuario = admin}
user ||--o{ availability : aplica a {tipo_usuario = barbeiro}

user ||--o{ barber_service : oferece {tipo_usuario = barbeiro}
service ||--o{ barber_service : detalhado em

@enduml

```

### Sequência - Agendamento (Cliente)

```
@startuml
title "Diagrama de Sequência: Realizar Agendamento"

actor Cliente
participant "Frontend (Navegador)" as FE
participant "Backend (Servidor Next.js)" as BE
database "Banco de Dados (PostgreSQL)" as DB

activate Cliente
Cliente -> FE: Acessa a página de agendamento
activate FE

FE -> BE: GET /api/servicos\\nSolicita lista de serviços
activate BE
BE -> DB: SELECT * FROM servicos WHERE ativo = true
activate DB
DB --> BE: Retorna lista de serviços
deactivate DB
BE --> FE: Responde com dados dos serviços
deactivate BE

FE --> Cliente: Exibe a lista de serviços
Cliente -> FE: Seleciona um serviço

FE -> BE: GET /api/disponibilidade?servicoId=X\\nSolicita horários disponíveis
activate BE
BE -> DB: Query para buscar barbeiros que oferecem o serviço\\ne seus horários disponíveis (JOIN com Disponibilidade)
activate DB
DB --> BE: Retorna horários e barbeiros disponíveis
deactivate DB
BE --> FE: Responde com os horários e barbeiros
deactivate BE

FE --> Cliente: Exibe os barbeiros e horários disponíveis
Cliente -> FE: Seleciona barbeiro e horário e confirma

FE -> BE: POST /api/agendamentos\\n{ clienteId, barbeiroId, servicoId, dataHoraInicio }
activate BE
BE -> BE: Valida os dados (e.g., verificar duplicidade)
BE -> DB: INSERT INTO agendamentos (...)
activate DB
DB --> BE: Confirmação de inserção
deactivate DB

BE -> FE: Responde com sucesso (status 201) e dados do agendamento
deactivate BE

FE -> Cliente: Exibe mensagem "Agendamento realizado com sucesso!"
deactivate FE
deactivate Cliente

@enduml

```

### Sequência - Agendamento (Admin)

```
@startuml
title "Diagrama de Sequência: Administrador Agenda para Novo Cliente"

actor Administrador
participant "Frontend (Painel Admin)" as FE
participant "Backend (Servidor Next.js)" as BE
database "Banco de Dados (PostgreSQL)" as DB

activate Administrador
Administrador -> FE: Inicia fluxo "Novo Agendamento"
activate FE

FE --> Administrador: Exibe tela para buscar ou criar cliente
Administrador -> FE: Opta por "Criar Novo Cliente" e insere dados (nome, telefone)

FE -> BE: POST /api/admin/clientes\\n{ nome, telefone }
activate BE
BE -> BE: Valida dados e cria novo usuário
BE -> DB: INSERT INTO usuarios (nome, telefone, tipo_usuario) VALUES (...)
activate DB
DB --> BE: Retorna dados do novo usuário (incluindo user_id)
deactivate DB
BE --> FE: Responde com sucesso (status 201) e dados do cliente criado
deactivate BE

FE -> FE: Armazena o ID do novo cliente
FE -> BE: GET /api/servicos\\nSolicita lista de serviços
activate BE
BE --> FE: Responde com dados dos serviços
deactivate BE

FE --> Administrador: Exibe tela de agendamento com cliente selecionado
Administrador -> FE: Seleciona serviço, barbeiro e horário

FE -> BE: POST /api/agendamentos\\n{ cliente_user_id, barbeiroId, servicoId, ... }
activate BE
BE -> DB: INSERT INTO agendamentos (...)
activate DB
DB --> BE: Confirmação de inserção
deactivate DB
BE --> FE: Responde com sucesso (status 201)
deactivate BE

FE --> Administrador: Exibe mensagem "Agendamento realizado com sucesso!"
deactivate FE
deactivate Administrador

@enduml

```

## Plano de Implementação

### Fase 1: Configuração e Estrutura

- [x]  Configurar ambiente de desenvolvimento (Node.js, pnpm, PostgreSQL).
- [x]  Inicializar repositório Git e configurar branches `main` e `dev`.
- [ ]  Configurar Drizzle ORM e esquema do banco (`src/server/db/schema.ts`).
- [ ]  Configurar Clerk para autenticação.
    - [ ]  Criar projeto na dashboard;
    - [ ]  Criar Roles;
    - [ ]  Criar auth.ts;
    - [ ]  Criar webhook para sincronizar com a database.
- [ ]  Implementar layout base (`src/app/layout.tsx`, `app-sidebar.tsx`), transferindo os mocks para o repo.
- [ ]  Configurar ESLint, Prettier e scripts de linting/formatação.
- [ ]  Adicionar OriginUI event-calendar e ajustar os types para nosso projeto.

### Fase 2: Módulo Cliente

- [ ]  Implementar página de login (`/login`, `login-form.tsx`).
- [ ]  Criar página de perfil (`/meu-perfil`).
- [ ]  Desenvolver fluxo de agendamento (`/agendar`, `ModalAgendamentoCliente.tsx`).
- [ ]  Implementar lista de agendamentos (`/meus-agendamentos`, `data-table.tsx`).
- [ ]  Criar funcionalidade de cancelamento (`ModalCancelarAgendamento.tsx`).
- [ ]  Integrar PagSeguro para pagamentos (`/agendar/pagamento/:id`, `ModalPagamento.tsx`).
- [ ]  Configurar notificações via toasts (`sonner.tsx`).

### Fase 3: Módulo Barbeiro

- [ ]  Implementar visualização de agenda (`/barbeiro/agenda`, integração com `event-calendar` da OriginUI).
- [ ]  Criar histórico de serviços (`/barbeiro/historico-servicos`, `data-table.tsx`).
- [ ]  Configurar edição de perfil (`/meu-perfil`).

### Fase 4: Módulo Administrador

- [ ]  Criar dashboard (`/admin/dashboard`, `chart-interactive-area.tsx`).
- [ ]  Implementar CRUD de clientes (`/admin/clientes`, modais correspondentes).
- [ ]  Implementar CRUD de barbeiros (`/admin/barbeiros`, modais correspondentes).
- [ ]  Implementar CRUD de serviços (`/admin/servicos`, modais correspondentes).
- [ ]  Desenvolver gerenciamento de disponibilidade (`/admin/disponibilidade`, `ModalAdicionarDisponibilidade.tsx`, `ModalBloquearHorario.tsx`).
- [ ]  Criar relatórios de faturamento (`/admin/relatorios/faturamento`, `chart.tsx`).
- [ ]  Implementar gerenciamento de agendamentos (`/admin/agendamentos`).

### Fase 5: Testes e Otimização

- [ ]  Configurar testes unitários para componentes e rotas de API.
- [ ]  Realizar testes de integração (autenticação, agendamentos, pagamentos).
- [ ]  Otimizar performance (lazy-load, caching com React Query).
- [ ]  Garantir responsividade com `use-mobile.ts`.

### Fase 6: Deploy e Monitoramento

- [ ]  Configurar deploy em plataforma (ex.: Vercel).
- [ ]  Configurar monitoramento de erros (ex.: Sentry).
- [ ]  Realizar testes de carga para agendamentos e pagamentos.
- [ ]  Documentar processo de deploy no README.
