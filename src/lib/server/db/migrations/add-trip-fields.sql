-- Add missing fields to trips table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS babies_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_min INTEGER,
ADD COLUMN IF NOT EXISTS budget_max INTEGER,
ADD COLUMN IF NOT EXISTS travel_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS activities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS additional_request TEXT;