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
