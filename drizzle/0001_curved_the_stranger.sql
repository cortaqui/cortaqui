DROP TABLE "cortaqui_nota_fiscal" CASCADE;--> statement-breakpoint
ALTER TABLE "cortaqui_agendamento" ADD COLUMN "criado_por_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cortaqui_agendamento" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "cortaqui_disponibilidade" ADD COLUMN "recorrente" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "cortaqui_disponibilidade" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "cortaqui_pagamento" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "cortaqui_servico" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "cortaqui_servico_barbeiro" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "cortaqui_usuario" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cortaqui_usuario" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;