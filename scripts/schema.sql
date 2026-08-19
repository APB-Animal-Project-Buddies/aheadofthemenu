-- FoodLP schema (settings table omitted: held the USDA API key)

CREATE TABLE `food_nutrients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`food_id` integer NOT NULL,
	`nutrient_key` text NOT NULL,
	`value_per_100g` real NOT NULL,
	`source_tier` integer DEFAULT 1 NOT NULL,
	`source_description` text,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `foods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`fdc_id` integer,
	`calcium_absorption_factor` real DEFAULT 1 NOT NULL,
	`is_phytate_rich` integer DEFAULT false NOT NULL,
	`is_precomputed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
, `is_supplement` integer DEFAULT false NOT NULL, `is_vegan` integer DEFAULT true NOT NULL, `cost_per_100g_usd` real, `cost_source_tier` integer, `cost_source_description` text, `cost_collected_at` text, `brand` text, `nutrition_researched_at` text);

CREATE TABLE `serving_sizes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`food_id` integer NOT NULL,
	`description` text NOT NULL,
	`grams` real NOT NULL,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `shopping_list_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`food_id` integer NOT NULL,
	`max_daily_amount_text` text,
	`max_daily_amount_grams` real,
	`excluded` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `vegan_classifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`food_name` text NOT NULL,
	`classification` text NOT NULL,
	`rewritten_name` text,
	`cached_at` text NOT NULL
);

