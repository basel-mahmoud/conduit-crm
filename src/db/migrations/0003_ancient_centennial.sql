CREATE TYPE "public"."discount_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."quotation_status" AS ENUM('draft', 'in_review', 'approved', 'sent', 'won', 'lost', 'expired');--> statement-breakpoint
CREATE TYPE "public"."revision_status" AS ENUM('draft', 'in_review', 'approved', 'sent', 'superseded');--> statement-breakpoint
CREATE TABLE "discount_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"quotation_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	"requested_pct" numeric(6, 3) NOT NULL,
	"requested_by" text,
	"status" "discount_approval_status" DEFAULT 'pending' NOT NULL,
	"approver_id" text,
	"reason" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quotation_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	"section_title" text DEFAULT 'General' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"qty" numeric(14, 3) DEFAULT '1' NOT NULL,
	"unit" text DEFAULT 'nos' NOT NULL,
	"material_unit_cost" numeric(14, 2) DEFAULT '0' NOT NULL,
	"labor_unit_cost" numeric(14, 2) DEFAULT '0' NOT NULL,
	"engineering_unit_cost" numeric(14, 2) DEFAULT '0' NOT NULL,
	"subcontractor_unit_cost" numeric(14, 2) DEFAULT '0' NOT NULL,
	"markup_pct" numeric(6, 3) DEFAULT '0' NOT NULL,
	"unit_price" numeric(14, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(16, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"quotation_id" uuid NOT NULL,
	"rev_no" integer DEFAULT 0 NOT NULL,
	"status" "revision_status" DEFAULT 'draft' NOT NULL,
	"valid_until" date,
	"notes" text,
	"vat_rate" numeric(5, 4) DEFAULT '0.0500' NOT NULL,
	"discount_pct" numeric(6, 3) DEFAULT '0' NOT NULL,
	"discount_approved" boolean DEFAULT true NOT NULL,
	"discount_approved_by" text,
	"material_cost" numeric(16, 2) DEFAULT '0' NOT NULL,
	"labor_cost" numeric(16, 2) DEFAULT '0' NOT NULL,
	"engineering_cost" numeric(16, 2) DEFAULT '0' NOT NULL,
	"subcontractor_cost" numeric(16, 2) DEFAULT '0' NOT NULL,
	"total_cost" numeric(16, 2) DEFAULT '0' NOT NULL,
	"subtotal" numeric(16, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(16, 2) DEFAULT '0' NOT NULL,
	"net_subtotal" numeric(16, 2) DEFAULT '0' NOT NULL,
	"vat_amount" numeric(16, 2) DEFAULT '0' NOT NULL,
	"grand_total" numeric(16, 2) DEFAULT '0' NOT NULL,
	"margin_amount" numeric(16, 2) DEFAULT '0' NOT NULL,
	"margin_pct" numeric(6, 2) DEFAULT '0' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"number" text NOT NULL,
	"title" text NOT NULL,
	"opportunity_id" uuid,
	"account_id" uuid,
	"project_type" "project_type" DEFAULT 'bms' NOT NULL,
	"status" "quotation_status" DEFAULT 'draft' NOT NULL,
	"current_revision_id" uuid,
	"currency" text DEFAULT 'AED' NOT NULL,
	"owner_id" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "discount_approvals" ADD CONSTRAINT "discount_approvals_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_approvals" ADD CONSTRAINT "discount_approvals_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_approvals" ADD CONSTRAINT "discount_approvals_revision_id_quotation_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."quotation_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_revision_id_quotation_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."quotation_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_revisions" ADD CONSTRAINT "quotation_revisions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_revisions" ADD CONSTRAINT "quotation_revisions_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dappr_quotation_idx" ON "discount_approvals" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "qline_revision_idx" ON "quotation_lines" USING btree ("revision_id");--> statement-breakpoint
CREATE INDEX "qrev_quotation_idx" ON "quotation_revisions" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "quotations_org_idx" ON "quotations" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "quotations_opp_idx" ON "quotations" USING btree ("opportunity_id");