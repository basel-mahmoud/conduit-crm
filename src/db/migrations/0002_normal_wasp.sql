CREATE TYPE "public"."lead_source" AS ENUM('referral', 'website', 'existing_client', 'consultant', 'tender', 'cold_outreach', 'other');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'unqualified', 'converted');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('bms', 'lcs', 'home_automation', 'ems', 'btu', 'hvac_controls', 'elv', 'other');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('na', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."opp_stage" AS ENUM('new', 'qualified', 'budgetary', 'technical', 'commercial', 'negotiation', 'awaiting_po', 'won', 'lost');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"ref_no" text NOT NULL,
	"source" "lead_source" DEFAULT 'other' NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"account_id" uuid,
	"consultant_id" uuid,
	"contractor_id" uuid,
	"project_name" text NOT NULL,
	"project_location" text,
	"project_type" "project_type" DEFAULT 'bms' NOT NULL,
	"est_value" numeric(14, 2),
	"next_follow_up_at" timestamp with time zone,
	"converted_opportunity_id" uuid,
	"owner_id" text,
	"notes" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"ref_no" text NOT NULL,
	"lead_id" uuid,
	"account_id" uuid,
	"name" text NOT NULL,
	"stage" "opp_stage" DEFAULT 'new' NOT NULL,
	"probability" integer DEFAULT 10 NOT NULL,
	"value" numeric(14, 2),
	"project_type" "project_type" DEFAULT 'bms' NOT NULL,
	"expected_close_date" date,
	"consultant_approval" "approval_status" DEFAULT 'na' NOT NULL,
	"contractor_approval" "approval_status" DEFAULT 'na' NOT NULL,
	"competitor" text,
	"lost_reason" text,
	"closed_at" timestamp with time zone,
	"owner_id" text,
	"notes" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_consultant_id_accounts_id_fk" FOREIGN KEY ("consultant_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_contractor_id_accounts_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_org_idx" ON "leads" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "leads_org_status_idx" ON "leads" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "leads_followup_idx" ON "leads" USING btree ("next_follow_up_at");--> statement-breakpoint
CREATE INDEX "opps_org_idx" ON "opportunities" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "opps_org_stage_idx" ON "opportunities" USING btree ("org_id","stage");--> statement-breakpoint
CREATE INDEX "opps_account_idx" ON "opportunities" USING btree ("account_id");