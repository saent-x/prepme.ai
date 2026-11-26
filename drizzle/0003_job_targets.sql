CREATE TABLE `job_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`advert` text NOT NULL,
	`cv_text` text,
	`cv_name` text,
	`interview_date` text,
	`fit` text,
	`rounds` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `job_targets_user_id_idx` ON `job_targets` (`user_id`);--> statement-breakpoint
-- Edited by hand: drizzle-kit leaves ON DELETE off a column added with ALTER TABLE. Deleting a job keeps its interviews.
ALTER TABLE `interviews` ADD `target_id` text REFERENCES job_targets(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `interviews` ADD `round_id` text;--> statement-breakpoint
CREATE INDEX `interviews_target_id_idx` ON `interviews` (`target_id`);