CREATE TYPE "public"."dia_semana_enum" AS ENUM('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO');--> statement-breakpoint
CREATE TYPE "public"."status_agendamento_enum" AS ENUM('CONFIRMADO', 'PENDENTE', 'CANCELADO', 'CONCLUIDO');--> statement-breakpoint
CREATE TYPE "public"."status_nota_enum" AS ENUM('EMITIDA', 'CANCELADA', 'ERRO');--> statement-breakpoint
CREATE TYPE "public"."status_pagamento_enum" AS ENUM('APROVADO', 'PENDENTE', 'REJEITADO');--> statement-breakpoint
CREATE TYPE "public"."tipo_disponibilidade_enum" AS ENUM('TRABALHO', 'BLOQUEIO');--> statement-breakpoint
CREATE TYPE "public"."tipo_usuario_enum" AS ENUM('CLIENTE', 'BARBEIRO', 'ADMIN');--> statement-breakpoint
CREATE TABLE "cortaqui_agendamento" (
	"agendamento_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_hora_inicio" timestamp with time zone NOT NULL,
	"data_hora_fim" timestamp with time zone NOT NULL,
	"status" "status_agendamento_enum" NOT NULL,
	"observacoes_cliente" text,
	"valor_cobrado" numeric(10, 2),
	"fk_Servico_servico_id" uuid,
	"fk_Usuario_cliente_id" uuid,
	"fk_Usuario_barbeiro_id" uuid
);
--> statement-breakpoint
CREATE TABLE "cortaqui_disponibilidade" (
	"disponibilidade_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dia_semana" "dia_semana_enum" NOT NULL,
	"hora_inicio" time NOT NULL,
	"hora_fim" time NOT NULL,
	"tipo" "tipo_disponibilidade_enum" NOT NULL,
	"data_especifica" date,
	"fk_Usuario_admin_id" uuid,
	"fk_Usuario_barbeiro_id" uuid
);
--> statement-breakpoint
CREATE TABLE "cortaqui_nota_fiscal" (
	"nota_fiscal_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" varchar(100),
	"chave_acesso" varchar(255) NOT NULL,
	"xml_url" varchar(512),
	"pdf_url" varchar(512),
	"data_emissao" timestamp with time zone NOT NULL,
	"status" "status_nota_enum" NOT NULL,
	"fk_Pagamento_pagamento_id" uuid,
	CONSTRAINT "cortaqui_nota_fiscal_chave_acesso_unique" UNIQUE("chave_acesso"),
	CONSTRAINT "cortaqui_nota_fiscal_fk_Pagamento_pagamento_id_unique" UNIQUE("fk_Pagamento_pagamento_id")
);
--> statement-breakpoint
CREATE TABLE "cortaqui_pagamento" (
	"pagamento_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_transacao_gateway" varchar(255),
	"status" "status_pagamento_enum" NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"data_pagamento" timestamp with time zone,
	"metodo" varchar(50),
	"fk_Agendamento_agendamento_id" uuid,
	CONSTRAINT "cortaqui_pagamento_fk_Agendamento_agendamento_id_unique" UNIQUE("fk_Agendamento_agendamento_id")
);
--> statement-breakpoint
CREATE TABLE "cortaqui_servico" (
	"servico_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"duracao_minutos" integer NOT NULL,
	"preco_base" numeric(10, 2) NOT NULL,
	"ativo" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cortaqui_servico_barbeiro" (
	"barbeiro_user_id" uuid NOT NULL,
	"servico_id" uuid NOT NULL,
	"preco_especifico" numeric(10, 2),
	CONSTRAINT "cortaqui_servico_barbeiro_barbeiro_user_id_servico_id_pk" PRIMARY KEY("barbeiro_user_id","servico_id")
);
--> statement-breakpoint
CREATE TABLE "cortaqui_usuario" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"telefone" varchar(20),
	"hash_senha" varchar(150) NOT NULL,
	"tipo_usuario" "tipo_usuario_enum" NOT NULL,
	"data_cadastro" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "cortaqui_usuario_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cortaqui_agendamento" ADD CONSTRAINT "cortaqui_agendamento_fk_Servico_servico_id_cortaqui_servico_servico_id_fk" FOREIGN KEY ("fk_Servico_servico_id") REFERENCES "public"."cortaqui_servico"("servico_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cortaqui_agendamento" ADD CONSTRAINT "cortaqui_agendamento_fk_Usuario_cliente_id_cortaqui_usuario_user_id_fk" FOREIGN KEY ("fk_Usuario_cliente_id") REFERENCES "public"."cortaqui_usuario"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cortaqui_agendamento" ADD CONSTRAINT "cortaqui_agendamento_fk_Usuario_barbeiro_id_cortaqui_usuario_user_id_fk" FOREIGN KEY ("fk_Usuario_barbeiro_id") REFERENCES "public"."cortaqui_usuario"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cortaqui_disponibilidade" ADD CONSTRAINT "cortaqui_disponibilidade_fk_Usuario_admin_id_cortaqui_usuario_user_id_fk" FOREIGN KEY ("fk_Usuario_admin_id") REFERENCES "public"."cortaqui_usuario"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cortaqui_disponibilidade" ADD CONSTRAINT "cortaqui_disponibilidade_fk_Usuario_barbeiro_id_cortaqui_usuario_user_id_fk" FOREIGN KEY ("fk_Usuario_barbeiro_id") REFERENCES "public"."cortaqui_usuario"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cortaqui_nota_fiscal" ADD CONSTRAINT "cortaqui_nota_fiscal_fk_Pagamento_pagamento_id_cortaqui_pagamento_pagamento_id_fk" FOREIGN KEY ("fk_Pagamento_pagamento_id") REFERENCES "public"."cortaqui_pagamento"("pagamento_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cortaqui_pagamento" ADD CONSTRAINT "cortaqui_pagamento_fk_Agendamento_agendamento_id_cortaqui_agendamento_agendamento_id_fk" FOREIGN KEY ("fk_Agendamento_agendamento_id") REFERENCES "public"."cortaqui_agendamento"("agendamento_id") ON DELETE cascade ON UPDATE no action;