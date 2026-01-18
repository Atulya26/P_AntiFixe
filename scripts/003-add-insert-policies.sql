-- Add INSERT policy for admin_users to allow first admin setup
-- This policy allows inserting only when no admin exists yet
CREATE POLICY "Allow first admin setup" ON admin_users
  FOR INSERT WITH CHECK (
    (SELECT COUNT(*) FROM admin_users) = 0
  );

-- Add ALL access policies for authenticated service role
-- These policies allow full CRUD operations for admin management
CREATE POLICY "Allow all operations on projects" ON projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on project_images" ON project_images
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin update and delete" ON admin_users
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin select for auth" ON admin_users
  FOR SELECT USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Admin users are not publicly readable" ON admin_users;
