-- Add thumbnail_url column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
