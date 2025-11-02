-- Sync production migration state
-- This marks all existing migrations (except the new one) as already applied

-- Insert all migration records that should already be in production
-- created_at is bigint (Unix timestamp in milliseconds)
-- Only insert if not already exists
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT hash, created_at FROM (VALUES
  ('0000_dashing_gambit', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0001_yielding_smiling_tiger', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0002_uneven_callisto', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0003_chief_jean_grey', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0004_dark_reavers', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0005_lucky_wendigo', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0006_silky_sentinels', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0007_concerned_elektra', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0008_brave_fallen_one', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0009_abnormal_thunderball', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0010_swift_dagger', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0011_young_shooting_star', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0012_uneven_iron_man', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0013_fast_autocomplete', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0013_material_caretaker', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0014_wide_gunslinger', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0015_unique_roughhouse', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0016_supreme_vertigo', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0017_huge_sharon_carter', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0018_lumpy_morlocks', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0019_absent_supreme_intelligence', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0020_abnormal_whiplash', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0021_fast_rumiko_fujikawa', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0022_sleepy_mentor', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0023_product_sequences', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0024_redundant_marauders', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0025_funny_loa', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0026_add_not_null_display_ids', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0027_drop_email_hash', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0028_right_moira_mactaggert', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0029_fix_text_column_constraints', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0030_remove_displayid', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0031_thick_the_twelve', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0032_orange_captain_midlands', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0033_events_table', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0033_normal_lockheed', EXTRACT(EPOCH FROM NOW()) * 1000),
  ('0034_user_deletions', EXTRACT(EPOCH FROM NOW()) * 1000)
) AS v(hash, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM drizzle.__drizzle_migrations m WHERE m.hash = v.hash
);

-- Verify what's tracked
SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at;
