-- Add GIN indexes for faster text search on destinations
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for trigram search
CREATE INDEX IF NOT EXISTS idx_destinations_city_gin ON destinations USING gin (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_destinations_country_gin ON destinations USING gin (country gin_trgm_ops);

-- Also create a composite index for city and country together
CREATE INDEX IF NOT EXISTS idx_destinations_city_country ON destinations (city, country);