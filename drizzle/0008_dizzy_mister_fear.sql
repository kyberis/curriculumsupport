ALTER TABLE "sessions" ADD COLUMN "session_summary" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "session_summary_user_msg_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_summary" text;