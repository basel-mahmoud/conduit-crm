CREATE TYPE "public"."asset_category" AS ENUM('controller', 'ddc', 'sensor', 'actuator', 'valve', 'thermostat', 'vfd', 'btu_meter', 'lighting_ctrl', 'hvac', 'other');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('active', 'faulty', 'decommissioned');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('draft', 'active', 'expiring', 'expired', 'renewed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('amc', 'ppm');--> statement-breakpoint
CREATE TYPE "public"."ppm_frequency" AS ENUM('monthly', 'quarterly', 'biannual', 'annual');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('p1', 'p2', 'p3', 'p4');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'assigned', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."ticket_type" AS ENUM('breakdown', 'request', 'ppm');--> statement-breakpoint
CREATE TYPE "public"."visit_status" AS ENUM('planned', 'completed', 'missed', 'rescheduled');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"account_id" uuid,
	"contract_id" uuid,
	"name" text NOT NULL,
	"category" "asset_category" DEFAULT 'controller' NOT NULL,
	"manufacturer" text,
	"model" text,
	"serial_no" text,
	"location" text,
	"install_date" date,
	"warranty_end" date,
	"status" "asset_status" DEFAULT 'active' NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"number" text NOT NULL,
	"type" "contract_type" DEFAULT 'amc' NOT NULL,
	"title" text NOT NULL,
	"account_id" uuid,
	"project_id" uuid,
	"value" numeric(16, 2),
	"annual_cost" numeric(16, 2),
	"status" "contract_status" DEFAULT 'active' NOT NULL,
	"ppm_frequency" "ppm_frequency",
	"start_date" date,
	"end_date" date,
	"renewal_reminder_at" date,
	"owner_id" text,
	"notes" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ppm_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"scheduled_date" date NOT NULL,
	"status" "visit_status" DEFAULT 'planned' NOT NULL,
	"technician_id" text,
	"completed_at" timestamp with time zone,
	"findings" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "service_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"number" text NOT NULL,
	"account_id" uuid,
	"contract_id" uuid,
	"asset_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"type" "ticket_type" DEFAULT 'breakdown' NOT NULL,
	"priority" "ticket_priority" DEFAULT 'p3' NOT NULL,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"sla_response_mins" integer DEFAULT 480 NOT NULL,
	"sla_resolve_mins" integer DEFAULT 2880 NOT NULL,
	"sla_due_at" timestamp with time zone,
	"assigned_to" text,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolution" text,
	"csat" integer,
	"owner_id" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppm_visits" ADD CONSTRAINT "ppm_visits_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppm_visits" ADD CONSTRAINT "ppm_visits_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_org_idx" ON "assets" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "assets_contract_idx" ON "assets" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "contracts_org_idx" ON "contracts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "contracts_org_status_idx" ON "contracts" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "visits_contract_idx" ON "ppm_visits" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "tickets_org_idx" ON "service_tickets" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "tickets_org_status_idx" ON "service_tickets" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "tickets_sla_idx" ON "service_tickets" USING btree ("sla_due_at");