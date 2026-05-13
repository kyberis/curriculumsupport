CREATE TYPE "public"."donate_event_type" AS ENUM('view', 'click_donate', 'click_crypto', 'click_paypal');--> statement-breakpoint
CREATE TABLE "donate_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "donate_event_type" NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
