-- Add return_profile column to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS return_profile varchar(32);
