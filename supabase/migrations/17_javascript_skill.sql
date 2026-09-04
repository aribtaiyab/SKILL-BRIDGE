-- Migration 17: JavaScript skill used by Frontend and Full Stack careers

INSERT INTO skills (id, name, slug, category, description, is_active) VALUES
('40000000-0000-0000-0000-000000000015', 'JavaScript', 'javascript', 'Frontend Basics', 'Modern JavaScript language fundamentals for browser and server applications', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, category = EXCLUDED.category, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO career_target_skills (career_target_id, skill_id, required_level, importance) VALUES
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000015', 80, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000015', 80, 'High')
ON CONFLICT (career_target_id, skill_id) DO UPDATE SET required_level = EXCLUDED.required_level, importance = EXCLUDED.importance;