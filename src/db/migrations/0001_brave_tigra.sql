CREATE TYPE "public"."account_rating" AS ENUM('a', 'b', 'c');--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('end_user', 'consultant', 'contractor', 'developer', 'fm', 'mep', 'supplier', 'brand_partner');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"type" "account_type" NOT NULL,
	"name" text NOT NULL,
	"trade_license" text,
	"vat_no" text,
	"industry" text,
	"website" text,
	"email" text,
	"phone" text,
	"rating" "account_rating" DEFAULT 'b' NOT NULL,
	"status" "account_status" DEFAULT 'active' NOT NULL,
	"address_line" text,
	"city" text,
	"country" text DEFAULT 'United Arab Emirates',
	"notes" text,
	"owner_id" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"title" text,
	"email" text,
	"phone" text,
	"mobile" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_org_idx" ON "accounts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "accounts_org_type_idx" ON "accounts" USING btree ("org_id","type");--> statement-breakpoint
CREATE INDEX "accounts_owner_idx" ON "accounts" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "contacts_account_idx" ON "contacts" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "contacts_org_idx" ON "contacts" USING btree ("org_id");