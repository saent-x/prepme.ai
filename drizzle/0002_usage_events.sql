CREATE TABLE `usage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`user_id` text,
	`interview_id` text,
	`kind` text NOT NULL,
	`model` text NOT NULL,
	`session` integer,
	`seconds` integer DEFAULT 0 NOT NULL,
	`context_limit` integer DEFAULT 0 NOT NULL,
	`responses` integer DEFAULT 0 NOT NULL,
	`input_text` integer DEFAULT 0 NOT NULL,
	`input_audio` integer DEFAULT 0 NOT NULL,
	`cached_text` integer DEFAULT 0 NOT NULL,
	`cached_audio` integer DEFAULT 0 NOT NULL,
	`output_text` integer DEFAULT 0 NOT NULL,
	`output_audio` integer DEFAULT 0 NOT NULL,
	`cost_micros` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usage_events_key_unique` ON `usage_events` (`key`);--> statement-breakpoint
CREATE INDEX `usage_events_interview_id_idx` ON `usage_events` (`interview_id`);--> statement-breakpoint
CREATE INDEX `usage_events_created_at_idx` ON `usage_events` (`created_at`);