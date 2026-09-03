-- Seed Data for SkillBridge Connect
-- Matches 100% with the Phase 1 UI screens, figures, and relationships

-- 1. Insert Institution & Departments
INSERT INTO institutions (id, name, type, location, website, description)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'Tech Institute of Modern Dev',
    'Institute of Technology',
    'San Francisco, CA',
    'https://techinst.edu',
    'Premier engineering institution pioneering skill-verified workforce readiness.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO departments (id, institution_id, name, description) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Computer Science', 'Software Engineering, Algorithms, and Distributed Systems'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Data Science', 'Machine Learning, Analytics, and Data Engineering'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Information Tech', 'Cloud Architecture, Networks, and Systems Administration'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Design', 'UI/UX, Product Design, and Human Computer Interaction')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Career Targets
INSERT INTO career_targets (id, name, slug, description, category, is_active) VALUES
('30000000-0000-0000-0000-000000000001', 'Backend Developer', 'backend', 'Focuses on server-side logic, database management, and API integration.', 'Engineering', true),
('30000000-0000-0000-0000-000000000002', 'Frontend Developer', 'frontend', 'Specializes in user interfaces, client-side rendering, and web performance.', 'Engineering', true),
('30000000-0000-0000-0000-000000000003', 'Full Stack Developer', 'fullstack', 'Covers end-to-end web development across frontend, backend, and DevOps.', 'Engineering', true),
('30000000-0000-0000-0000-000000000004', 'Cybersecurity Analyst', 'security', 'Protects systems, networks, and data from cyber threats and vulnerabilities.', 'Security', true),
('30000000-0000-0000-0000-000000000005', 'DevOps Engineer', 'devops', 'Automates infrastructure, continuous delivery pipelines, and cloud reliability.', 'Operations', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Skills
INSERT INTO skills (id, name, slug, category, description, is_active) VALUES
('40000000-0000-0000-0000-000000000001', 'Node.js', 'nodejs', 'Backend & APIs', 'JavaScript runtime for server-side event-driven applications', true),
('40000000-0000-0000-0000-000000000002', 'REST API Design', 'rest-apis', 'Backend & APIs', 'Designing scalable, secure, and standardized RESTful endpoints', true),
('40000000-0000-0000-0000-000000000003', 'PostgreSQL / SQL', 'sql-postgres', 'Database & Storage', 'Relational database schema modeling, indexing, and complex queries', true),
('40000000-0000-0000-0000-000000000004', 'Git Version Control', 'git', 'Tools & Infrastructure', 'Branching workflows, merges, rebasing, and GitHub collaboration', true),
('40000000-0000-0000-0000-000000000005', 'Docker', 'docker', 'Tools & Infrastructure', 'Containerization, multi-stage builds, and Docker Compose environments', true),
('40000000-0000-0000-0000-000000000006', 'React', 'react', 'Frontend Basics', 'Component lifecycles, state management, and modern React hooks', true),
('40000000-0000-0000-0000-000000000007', 'HTML/CSS', 'html-css', 'Frontend Basics', 'Semantic HTML5 markup and responsive layout styling with modern CSS', true),
('40000000-0000-0000-0000-000000000008', 'MongoDB', 'mongodb', 'Database & Storage', 'NoSQL document database querying and aggregation pipelines', true),
('40000000-0000-0000-0000-000000000009', 'Redis', 'redis', 'Database & Storage', 'In-memory data structures, caching layers, and pub/sub messaging', true),
('40000000-0000-0000-0000-000000000010', 'GraphQL', 'graphql', 'Backend & APIs', 'Schema definition, queries, mutations, and resolver execution', true),
('40000000-0000-0000-0000-000000000011', 'AWS Basics', 'aws-basics', 'Tools & Infrastructure', 'Cloud compute (EC2), storage (S3), and serverless fundamentals', true),
('40000000-0000-0000-0000-000000000012', 'Python', 'python', 'Technical', 'Data structures, scripting, and backend processing in Python', true),
('40000000-0000-0000-0000-000000000013', 'REST API Security', 'rest-api-security', 'Backend & APIs', 'JWT authentication, RBAC, rate limiting, and CORS headers', true),
('40000000-0000-0000-0000-000000000014', 'System Design Basics', 'system-design', 'Technical', 'Microservices architecture, caching strategies, and load balancing', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Map Career Target Requirements (e.g. Backend Developer requirements)
INSERT INTO career_target_skills (career_target_id, skill_id, required_level, importance) VALUES
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 80, 'Critical'), -- Node.js (Req: 80)
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 75, 'High'),     -- REST APIs (Req: 75)
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 70, 'High'),     -- SQL (Req: 70)
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 60, 'Medium'),   -- Git (Req: 60)
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 50, 'Medium')    -- Docker (Req: 50)
ON CONFLICT (career_target_id, skill_id) DO NOTHING;

-- 5. Profiles for Primary Roles
-- Student: Sarah Jenkins
INSERT INTO profiles (id, email, full_name, role, location, bio) VALUES
('00000000-0000-0000-0000-000000000001', 'sarah.jenkins@student.techinst.edu', 'Sarah Jenkins', 'student', 'San Francisco, CA (Open to Remote)', 'Aspiring backend engineer passionate about microservices and scalable APIs.')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

INSERT INTO student_profiles (profile_id, education, institution_id, department_id, graduation_year, experience_level, target_career_id, onboarding_completed) VALUES
('00000000-0000-0000-0000-000000000001', 'B.S. Computer Science', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 2024, 'Student', '30000000-0000-0000-0000-000000000001', true)
ON CONFLICT (profile_id) DO NOTHING;

-- Industry Users
INSERT INTO profiles (id, email, full_name, role, location) VALUES
('00000000-0000-0000-0000-000000000002', 'talent@techflow.io', 'TechFlow Solutions Recruiter', 'industry', 'San Francisco, CA'),
('00000000-0000-0000-0000-000000000005', 'hiring@datasync.com', 'DataSync Talent Team', 'industry', 'Remote'),
('00000000-0000-0000-0000-000000000006', 'connect@seniordev.net', 'Senior Dev Network', 'industry', 'Remote'),
('00000000-0000-0000-0000-000000000007', 'jobs@cloudcore.io', 'CloudCore Systems', 'industry', 'Seattle, WA'),
('00000000-0000-0000-0000-000000000008', 'recruiting@startuphub.com', 'Startup Hub', 'industry', 'Austin, TX'),
('00000000-0000-0000-0000-000000000009', 'training@enterprisesys.com', 'Enterprise Systems', 'industry', 'Chicago, IL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO industry_profiles (profile_id, organization_name, industry_type, organization_size, location, website) VALUES
('00000000-0000-0000-0000-000000000002', 'TechFlow Solutions', 'Software & Cloud', '200-500', 'San Francisco, CA', 'https://techflow.io'),
('00000000-0000-0000-0000-000000000005', 'DataSync Inc', 'Data Infrastructure', '50-200', 'Remote', 'https://datasync.com'),
('00000000-0000-0000-0000-000000000006', 'Senior Dev Network', 'Mentorship & Tech Community', '10-50', 'Remote', 'https://seniordev.net'),
('00000000-0000-0000-0000-000000000007', 'CloudCore', 'Cloud Services', '500-1000', 'Seattle, WA', 'https://cloudcore.io'),
('00000000-0000-0000-0000-000000000008', 'Startup Hub', 'Venture Incubator', '20-50', 'Austin, TX', 'https://startuphub.com'),
('00000000-0000-0000-0000-000000000009', 'Enterprise Systems', 'Enterprise IT', '1000+', 'Chicago, IL', 'https://enterprisesys.com')
ON CONFLICT (profile_id) DO NOTHING;

-- Academician: Prof. Robert Vance
INSERT INTO profiles (id, email, full_name, role, location) VALUES
('00000000-0000-0000-0000-000000000003', 'r.vance@techinst.edu', 'Prof. Robert Vance', 'academician', 'San Francisco, CA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academician_profiles (profile_id, institution_id, department_id, designation, teaching_area) VALUES
('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Associate Professor', 'Software Engineering & Cloud Architecture')
ON CONFLICT (profile_id) DO NOTHING;

-- Institution Profile: Tech Institute Admin
INSERT INTO profiles (id, email, full_name, role, location) VALUES
('00000000-0000-0000-0000-000000000004', 'admin@techinst.edu', 'Tech Institute Administration', 'institution', 'San Francisco, CA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO institution_profiles (profile_id, institution_id, institution_name, institution_type, location, website) VALUES
('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Tech Institute of Modern Dev', 'Institute of Technology', 'San Francisco, CA', 'https://techinst.edu')
ON CONFLICT (profile_id) DO NOTHING;

-- Additional Student Profiles for Candidate / Cohort Intelligence
INSERT INTO profiles (id, email, full_name, role, location) VALUES
('00000000-0000-0000-0000-000000000010', 'michael.chen@student.techinst.edu', 'Michael Chen', 'student', 'San Francisco, CA'),
('00000000-0000-0000-0000-000000000011', 'david.rodriguez@student.techinst.edu', 'David Rodriguez', 'student', 'San Francisco, CA'),
('00000000-0000-0000-0000-000000000012', 'emily.wang@student.techinst.edu', 'Emily Wang', 'student', 'San Francisco, CA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO student_profiles (profile_id, education, institution_id, department_id, graduation_year, target_career_id, onboarding_completed) VALUES
('00000000-0000-0000-0000-000000000010', 'B.S. Computer Science', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 2024, '30000000-0000-0000-0000-000000000002', true),
('00000000-0000-0000-0000-000000000011', 'B.S. Computer Science', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 2024, '30000000-0000-0000-0000-000000000001', true),
('00000000-0000-0000-0000-000000000012', 'B.S. Data Science', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 2024, '30000000-0000-0000-0000-000000000001', true)
ON CONFLICT (profile_id) DO NOTHING;

-- 6. Student Skills (Exact Phase 1 values for Sarah Jenkins)
INSERT INTO student_skills (student_id, skill_id, self_declared_level, current_level, verified_level, verification_status) VALUES
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 65, 65, 65, 'assessment_verified'), -- Node.js: 65
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 72, 72, 72, 'practical_verified'),  -- REST APIs: 72
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 82, 82, 82, 'evidence_verified'),   -- SQL: 82
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 75, 75, 75, 'practical_verified'),  -- Git: 75
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 20, 20, 0,  'self_declared'),       -- Docker: 20
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', 60, 60, 60, 'assessment_verified'), -- React: 60
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000007', 85, 85, 85, 'practical_verified'),  -- HTML/CSS: 85
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000008', 55, 55, 55, 'assessment_verified'), -- MongoDB: 55
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000009', 20, 20, 0,  'self_declared'),       -- Redis: 20
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000010', 30, 30, 0,  'self_declared'),       -- GraphQL: 30
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000011', 15, 15, 0,  'self_declared')        -- AWS Basics: 15
ON CONFLICT (student_id, skill_id) DO NOTHING;

-- 7. Skill Gaps for Sarah Jenkins against Backend Developer Target
INSERT INTO skill_gaps (student_id, career_target_id, skill_id, required_score, current_score, gap_score, priority, status) VALUES
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 80, 65, 15, 'Critical', 'critical'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 75, 72, 3,  'Medium',   'needs_improvement'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 50, 20, 30, 'Low',      'needs_improvement'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 70, 82, 0,  'Low',      'ready'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 60, 75, 0,  'Low',      'ready')
ON CONFLICT (student_id, career_target_id, skill_id) DO NOTHING;

-- 8. Assessments & Questions
INSERT INTO assessments (id, title, description, skill_id, career_target_id, difficulty, assessment_type, time_limit, total_questions, passing_score)
VALUES (
    '50000000-0000-0000-0000-000000000001',
    'Node.js Fundamentals',
    'Validate your core understanding of Node.js, event loop, streams, and built-in modules.',
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'Intermediate',
    'knowledge',
    15,
    5,
    70
) ON CONFLICT (id) DO NOTHING;

INSERT INTO assessment_questions (id, assessment_id, question_text, points, order_index) VALUES
('51000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Which of the following best describes the Node.js event loop?', 20, 1),
('51000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'How does Node.js handle child processes?', 20, 2),
('51000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', 'What is the primary purpose of Streams in Node.js?', 20, 3),
('51000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000001', 'Which error handling approach is NOT standard in Node.js asynchronous code?', 20, 4),
('51000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000001', 'What does the ''fs'' module provide?', 20, 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO assessment_options (question_id, option_text, order_index, is_correct) VALUES
('51000000-0000-0000-0000-000000000001', 'A multi-threaded mechanism for handling background tasks concurrently.', 1, false),
('51000000-0000-0000-0000-000000000001', 'A single-threaded, non-blocking mechanism that handles asynchronous callbacks.', 2, true),
('51000000-0000-0000-0000-000000000001', 'A synchronous loop that executes all code line-by-line before continuing.', 3, false),
('51000000-0000-0000-0000-000000000001', 'An external library that must be imported for async operations.', 4, false),

('51000000-0000-0000-0000-000000000002', 'It cannot spawn child processes; everything runs on one thread.', 1, false),
('51000000-0000-0000-0000-000000000002', 'Using the ''child_process'' module to spawn or fork new processes.', 2, true),
('51000000-0000-0000-0000-000000000002', 'Automatically creating a new thread for every incoming HTTP request.', 3, false),
('51000000-0000-0000-0000-000000000002', 'By utilizing the DOM Web Workers API.', 4, false),

('51000000-0000-0000-0000-000000000003', 'To play audio and video files in the browser.', 1, false),
('51000000-0000-0000-0000-000000000003', 'To read or write data sequentially in chunks without loading everything into memory.', 2, true),
('51000000-0000-0000-0000-000000000003', 'To establish WebSocket connections with clients.', 3, false),
('51000000-0000-0000-0000-000000000003', 'To bundle JavaScript files for production.', 4, false),

('51000000-0000-0000-0000-000000000004', 'Error-first callbacks (e.g., cb(err, data)).', 1, false),
('51000000-0000-0000-0000-000000000004', 'Using Promises and .catch().', 2, false),
('51000000-0000-0000-0000-000000000004', 'Using async/await with try/catch blocks.', 3, false),
('51000000-0000-0000-0000-000000000004', 'Throwing exceptions globally without catching them.', 4, true),

('51000000-0000-0000-0000-000000000005', 'File system interaction like reading and writing files.', 1, true),
('51000000-0000-0000-0000-000000000005', 'Fast server setup capabilities.', 2, false),
('51000000-0000-0000-0000-000000000005', 'Format styling for console outputs.', 3, false),
('51000000-0000-0000-0000-000000000005', 'Firewall security rules configuration.', 4, false);

-- 9. Projects & Certifications for Sarah Jenkins (Skill Passport)
INSERT INTO projects (id, student_id, title, description, technologies, start_date, end_date) VALUES
('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'E-Commerce API Platform', 'Built a fully functional REST API for an e-commerce platform including user authentication (JWT), product catalog management, and order processing logic.', ARRAY['Node.js', 'Express', 'PostgreSQL'], '2023-06-01', '2023-08-30'),
('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Real-time Chat Service', 'Implemented a WebSocket-based chat service allowing real-time messaging between users in different rooms.', ARRAY['Socket.io', 'Redis'], '2023-09-01', '2023-10-15')
ON CONFLICT (id) DO NOTHING;

INSERT INTO certifications (id, student_id, name, issuing_organization, issue_date, verification_status) VALUES
('61000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PostgreSQL Associate Certification', 'PostgreSQL Professional Guild', '2023-08-15', 'evidence_verified'),
('61000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Node.js Certified Developer', 'OpenJS Foundation', '2023-10-01', 'assessment_verified')
ON CONFLICT (id) DO NOTHING;

-- 10. Opportunities
INSERT INTO opportunities (id, industry_id, title, description, opportunity_type, location, work_mode, duration, deadline, status) VALUES
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Backend Developer Internship', 'Join our core platform team to help build and scale our microservices architecture. Design RESTful APIs, optimize SQL queries, and implement secure auth.', 'Internship', 'San Francisco, CA (Hybrid)', 'hybrid', '6 Months', '2024-10-30', 'published'),
('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'Junior API Developer', 'Develop resilient microservices and public API gateways for high-throughput transactional pipelines.', 'Job', 'Remote', 'remote', 'Full-time', '2024-11-15', 'published'),
('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006', 'Backend Mentorship Program', '1-on-1 mentorship with staff engineers focusing on distributed systems architecture, clean code, and career guidance.', 'Mentorship', 'Remote', 'remote', '3 Months', '2024-12-31', 'published'),
('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007', 'Cloud Infrastructure Intern', 'Assist CloudCore operations in configuring Terraform automation and Kubernetes cluster deployments.', 'Internship', 'Seattle, WA', 'onsite', '3 Months', '2024-10-20', 'published'),
('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000009', 'Industrial Training: Database Architecture', 'Intensive 4-week workshop and hands-on laboratory on advanced PostgreSQL clustering and indexing strategies.', 'Industrial Training', 'Chicago, IL', 'onsite', '4 Weeks', '2024-11-01', 'published'),
('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000008', 'Full Stack Developer', 'Rapidly prototype and iterate across React frontend and Node.js backend features in an agile startup environment.', 'Job', 'Austin, TX', 'hybrid', 'Full-time', '2024-12-01', 'published')
ON CONFLICT (id) DO NOTHING;

-- Opportunity Skills
INSERT INTO opportunity_skills (opportunity_id, skill_id, minimum_level, importance) VALUES
('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 60, 'Required'), -- Node.js
('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 70, 'Required'), -- REST APIs
('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 60, 'Required'), -- SQL
('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 30, 'Preferred') -- Docker
ON CONFLICT (opportunity_id, skill_id) DO NOTHING;

-- 11. Opportunity Matches for Sarah Jenkins
INSERT INTO opportunity_matches (opportunity_id, student_id, match_percentage, skill_match_percentage, explanation, missing_skills) VALUES
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 91, 93, 'Exceeds verified requirements in Node.js (65/60), REST APIs (72/70), and SQL (82/60).', '["Docker Basics"]'::jsonb),
('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 85, 87, 'Solid alignment with Express and PostgreSQL stack.', '["GraphQL"]'::jsonb),
('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 100, 100, 'Perfect baseline match for backend mentorship.', '[]'::jsonb),
('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 62, 60, 'Requires AWS Cloud Foundations and Linux sysadmin verification.', '["AWS Basics", "Linux"]'::jsonb),
('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 94, 96, 'High database proficiency (SQL score 82).', '["NoSQL"]'::jsonb),
('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 58, 55, 'Needs stronger React and TypeScript verification.', '["React", "TypeScript"]'::jsonb)
ON CONFLICT (opportunity_id, student_id) DO NOTHING;

-- 12. Applications for Sarah Jenkins
INSERT INTO applications (id, opportunity_id, student_id, current_status, applied_at) VALUES
('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'shortlisted', '2023-10-15T10:00:00Z'),
('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'applied',     '2023-10-20T14:30:00Z'),
('80000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'rejected',    '2023-09-10T09:15:00Z'),
('80000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'selected',    '2023-08-05T11:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Application Status History
INSERT INTO application_status_history (application_id, status, note, changed_at) VALUES
('80000000-0000-0000-0000-000000000001', 'applied', 'Application submitted with verified Skill Passport.', '2023-10-15T10:00:00Z'),
('80000000-0000-0000-0000-000000000001', 'shortlisted', 'Candidate profile passed skill threshold verification.', '2023-10-18T16:00:00Z'),

('80000000-0000-0000-0000-000000000002', 'applied', 'Application submitted for Junior API Developer.', '2023-10-20T14:30:00Z'),

('80000000-0000-0000-0000-000000000003', 'applied', 'Applied to Full Stack Developer role.', '2023-09-10T09:15:00Z'),
('80000000-0000-0000-0000-000000000003', 'rejected', 'Strong backend skills, but requires more React experience for this specific role.', '2023-09-25T11:00:00Z'),

('80000000-0000-0000-0000-000000000004', 'applied', 'Applied to Backend Mentorship Program.', '2023-08-05T11:00:00Z'),
('80000000-0000-0000-0000-000000000004', 'selected', 'Matched with Senior Staff Engineer mentor.', '2023-08-20T15:00:00Z');

-- 13. Progress History (6-Month progression)
INSERT INTO progress_history (student_id, skill_id, score, recorded_at, source) VALUES
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 40, '2023-05-15T00:00:00Z', 'initial_assessment'),
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 50, '2023-05-15T00:00:00Z', 'initial_assessment'),

('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 45, '2023-06-15T00:00:00Z', 'reassessment'),
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 55, '2023-06-15T00:00:00Z', 'reassessment'),

('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 45, '2023-07-15T00:00:00Z', 'assessment'),
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 60, '2023-07-15T00:00:00Z', 'assessment'),

('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 55, '2023-08-15T00:00:00Z', 'reassessment'),
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 70, '2023-08-15T00:00:00Z', 'reassessment'),

('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 60, '2023-09-15T00:00:00Z', 'reassessment'),
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 75, '2023-09-15T00:00:00Z', 'reassessment'),

('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 65, '2023-10-15T00:00:00Z', 'assessment'),
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 82, '2023-10-15T00:00:00Z', 'practical');

-- 14. Academician & Institution Analytics
INSERT INTO institution_analytics (institution_id, department_id, metric_date, total_students, overall_readiness, average_verified_skill, students_needing_intervention, internship_participation, placement_readiness) VALUES
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', CURRENT_DATE, 120, 76, 78, 15, 42, 76),
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', CURRENT_DATE, 95, 68, 70, 18, 30, 68),
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', CURRENT_DATE, 80, 62, 65, 22, 25, 62),
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', CURRENT_DATE, 60, 85, 88, 5, 28, 85)
ON CONFLICT (institution_id, department_id, metric_date) DO NOTHING;

-- Industry Skill Demand
INSERT INTO industry_skill_demand (skill_id, industry_type, demand_count, demand_percentage, trend, period_start, period_end) VALUES
('40000000-0000-0000-0000-000000000006', 'Technology', 180, 90, 'up', '2023-01-01', '2023-12-31'),
('40000000-0000-0000-0000-000000000001', 'Technology', 165, 85, 'up', '2023-01-01', '2023-12-31'),
('40000000-0000-0000-0000-000000000003', 'Technology', 140, 75, 'flat', '2023-01-01', '2023-12-31'),
('40000000-0000-0000-0000-000000000011', 'Technology', 150, 80, 'flat', '2023-01-01', '2023-12-31');
