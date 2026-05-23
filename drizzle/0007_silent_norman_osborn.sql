ALTER TABLE "sessions" ADD COLUMN "conversation_summary" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "summary_up_to_count" integer DEFAULT 0 NOT NULL;