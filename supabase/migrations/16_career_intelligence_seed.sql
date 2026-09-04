-- Migration 16: Supported career targets and distinct skill requirements

INSERT INTO career_targets (id, name, slug, description, category, is_active) VALUES
('30000000-0000-0000-0000-000000000001', 'Backend Developer', 'backend', 'Focuses on server-side logic, database management, and API integration.', 'Engineering', true),
('30000000-0000-0000-0000-000000000002', 'Frontend Developer', 'frontend', 'Specializes in user interfaces, client-side rendering, and web performance.', 'Engineering', true),
('30000000-0000-0000-0000-000000000003', 'Full Stack Developer', 'fullstack', 'Covers end-to-end web development across frontend, backend, and DevOps.', 'Engineering', true),
('30000000-0000-0000-0000-000000000004', 'Cybersecurity Analyst', 'security', 'Protects systems, networks, and data from cyber threats and vulnerabilities.', 'Security', true),
('30000000-0000-0000-0000-000000000006', 'Data Analyst', 'data-analyst', 'Transforms business data into clear analysis, reporting, and decisions.', 'Data', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, category = EXCLUDED.category, is_active = EXCLUDED.is_active;

INSERT INTO career_target_skills (career_target_id, skill_id, required_level, importance) VALUES
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 80, 'High'),
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 75, 'High'),
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 70, 'High'),
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 60, 'Medium'),
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 50, 'Medium'),
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000006', 75, 'High'),
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000007', 80, 'High'),
('30000000-0000-0000-0000-000000000002', '40000000-0000-000000000004', 60, 'Medium'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006', 75, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 75, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 75, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', 70, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', 60, 'Medium'),
('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000013', 80, 'High'),
('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000012', 70, 'High'),
('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000014', 65, 'Medium'),
('30000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000012', 80, 'High'),
('30000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000003', 80, 'High'),
('30000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000008', 65, 'Medium')
ON CONFLICT (career_target_id, skill_id) DO UPDATE SET required_level = EXCLUDED.required_level, importance = EXCLUDED.importance;