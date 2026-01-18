-- Insert sample projects
INSERT INTO projects (id, title, description, sort_order) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Modern Architecture', 'A stunning collection of contemporary architectural photography showcasing clean lines and bold designs.', 1),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Urban Landscapes', 'Capturing the essence of city life through dramatic cityscapes and street photography.', 2),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Nature & Wildlife', 'Breathtaking natural scenes and wildlife moments frozen in time.', 3);

-- Insert sample project images
INSERT INTO project_images (project_id, image_url, sort_order) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '/placeholder.svg?height=800&width=1200', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '/placeholder.svg?height=800&width=1200', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '/placeholder.svg?height=800&width=1200', 3),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '/placeholder.svg?height=800&width=1200', 1),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '/placeholder.svg?height=800&width=1200', 2),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '/placeholder.svg?height=800&width=1200', 3),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', '/placeholder.svg?height=800&width=1200', 1),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', '/placeholder.svg?height=800&width=1200', 2),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', '/placeholder.svg?height=800&width=1200', 3);
