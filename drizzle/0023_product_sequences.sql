CREATE TABLE IF NOT EXISTS "product_sequences" (
	"year_month" varchar(6) PRIMARY KEY NOT NULL,
	"last_sequence" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);