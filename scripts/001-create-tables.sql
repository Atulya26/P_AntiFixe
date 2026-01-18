-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT4 DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_images table
CREATE TABLE IF NOT EXISTS project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT4 DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access on projects and project_images
CREATE POLICY "Allow public read access on projects" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on project_images" ON project_images
  FOR SELECT USING (true);

-- Admin users should not be publicly readable
CREATE POLICY "Admin users are not publicly readable" ON admin_users
  FOR SELECT USING (false);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON projects(sort_order);
CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON project_images(project_id);
CREATE INDEX IF NOT EXISTS idx_project_images_sort_order ON project_images(sort_order);
