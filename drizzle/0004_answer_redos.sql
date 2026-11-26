CREATE TABLE `answer_redos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`interview_id` text NOT NULL,
	`question_index` integer NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`previous_score` integer NOT NULL,
	`score` integer NOT NULL,
	`feedback` text NOT NULL,
	`tip` text NOT NULL,
	`spoken` integer DEFAULT true NOT NULL,
	`seconds` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`interview_id`) REFERENCES `interviews`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `answer_redos_interview_id_idx` ON `answer_redos` (`interview_id`);--> statement-breakpoint
CREATE INDEX `answer_redos_user_id_idx` ON `answer_redos` (`user_id`);