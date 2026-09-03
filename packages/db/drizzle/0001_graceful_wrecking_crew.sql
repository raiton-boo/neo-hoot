ALTER TYPE "public"."game_session_status" ADD VALUE 'expired';--> statement-breakpoint
CREATE TABLE "game_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_session_id" uuid NOT NULL,
	"participant_stats" jsonb NOT NULL,
	"question_stats" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_result_game_session_id_unique" UNIQUE("game_session_id")
);
--> statement-breakpoint
ALTER TABLE "game_result" ADD CONSTRAINT "game_result_game_session_id_game_session_id_fk" FOREIGN KEY ("game_session_id") REFERENCES "public"."game_session"("id") ON DELETE cascade ON UPDATE no action;