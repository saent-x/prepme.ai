CREATE TABLE `job_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_id` text NOT NULL,
	`round_id` text,
	`question` text NOT NULL,
	`why` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_id`) REFERENCES `job_targets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `job_questions_target_id_idx` ON `job_questions` (`target_id`);--> statement-breakpoint
CREATE TABLE `question_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`answer` text NOT NULL,
	`score` integer NOT NULL,
	`feedback` text NOT NULL,
	`tip` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`spoken` integer DEFAULT true NOT NULL,
	`seconds` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `job_questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `question_answers_question_id_idx` ON `question_answers` (`question_id`);--> statement-breakpoint
CREATE INDEX `question_answers_user_id_idx` ON `question_answers` (`user_id`);--> statement-breakpoint
CREATE TABLE `stories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_id` text,
	`title` text NOT NULL,
	`question` text NOT NULL,
	`text` text NOT NULL,
	`score` integer NOT NULL,
	`source` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_id`) REFERENCES `job_targets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `stories_user_id_idx` ON `stories` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `stories_user_source_idx` ON `stories` (`user_id`,`source`);--> statement-breakpoint
ALTER TABLE `answer_redos` ADD `title` text DEFAULT '' NOT NULL;