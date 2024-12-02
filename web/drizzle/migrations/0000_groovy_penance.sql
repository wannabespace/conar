CREATE TABLE IF NOT EXISTS "accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text
);
--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
