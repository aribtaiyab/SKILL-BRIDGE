/**
 * SkillBridge Connect - Deterministic Benchmark Engine & Career Target Profiles
 *
 * Implements the official Opportunity-Specific Skill Readiness Engine specifications.
 * Zero-crash guarantee: If database or external AI service is unavailable,
 * calculates weighted readiness deterministically.
 */

export interface SkillBenchmark {
  required: number
  weight: number
  priority?: 'High' | 'Medium' | 'Low'
  category?: string
  skillId?: string
}

export interface CareerBenchmarkProfile {
  id: string
  name: string
  slug: string
  category: string
  description: string
  skills: Record<string, SkillBenchmark>
}

export const CAREER_BENCHMARK_PROFILES: CareerBenchmarkProfile[] = [
  {
    id: "30000000-0000-0000-0000-000000000003",
    name: "Full Stack Developer",
    slug: "fullstack",
    category: "Engineering",
    description: "Covers end-to-end web development across modern frontend, backend services, databases, and deployment.",
    skills: {
      "HTML": { required: 80, weight: 0.07, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000016' },
      "CSS": { required: 80, weight: 0.07, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000017' },
      "JavaScript": { required: 85, weight: 0.10, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000015' },
      "React.js": { required: 75, weight: 0.10, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000006' },
      "Node.js": { required: 75, weight: 0.10, priority: 'High', category: 'Backend', skillId: '40000000-0000-0000-0000-000000000001' },
      "Express.js": { required: 75, weight: 0.08, priority: 'Medium', category: 'Backend', skillId: 'skill-fs-express' },
      "MongoDB": { required: 70, weight: 0.08, priority: 'Medium', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000008' },
      "SQL / Databases": { required: 75, weight: 0.10, priority: 'High', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000003' },
      "REST APIs": { required: 80, weight: 0.08, priority: 'High', category: 'Backend', skillId: '40000000-0000-0000-0000-000000000002' },
      "Git / GitHub": { required: 70, weight: 0.06, priority: 'Medium', category: 'Tools', skillId: '40000000-0000-0000-0000-000000000004' },
      "Authentication": { required: 70, weight: 0.06, priority: 'Medium', category: 'Security', skillId: 'skill-fs-auth' },
      "Deployment": { required: 65, weight: 0.06, priority: 'Medium', category: 'Operations', skillId: 'skill-fs-deploy' },
      "Problem Solving / DSA": { required: 75, weight: 0.08, priority: 'Medium', category: 'Computer Science', skillId: 'skill-fs-dsa' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000001",
    name: "Backend Developer",
    slug: "backend",
    category: "Engineering",
    description: "Focuses on server-side logic, database management, and resilient REST API integration.",
    skills: {
      "Node.js": { required: 80, weight: 0.35, priority: 'High', category: 'Backend', skillId: '40000000-0000-0000-0000-000000000001' },
      "REST APIs": { required: 75, weight: 0.25, priority: 'High', category: 'Backend', skillId: '40000000-0000-0000-0000-000000000002' },
      "SQL": { required: 70, weight: 0.25, priority: 'High', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000003' },
      "Git & Version Control": { required: 60, weight: 0.15, priority: 'Medium', category: 'Tools', skillId: '40000000-0000-0000-0000-000000000004' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000002",
    name: "Frontend Developer",
    slug: "frontend",
    category: "Engineering",
    description: "Specializes in modern React user interfaces, client-side rendering, and responsive styling.",
    skills: {
      "HTML": { required: 80, weight: 0.15, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000016' },
      "CSS": { required: 80, weight: 0.15, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000017' },
      "JavaScript": { required: 80, weight: 0.20, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000015' },
      "React": { required: 75, weight: 0.15, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000006' },
      "Responsive Design": { required: 75, weight: 0.10, priority: 'Medium', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000018' },
      "Git/GitHub": { required: 65, weight: 0.10, priority: 'Medium', category: 'Tools', skillId: '40000000-0000-0000-0000-000000000004' },
      "API Integration": { required: 75, weight: 0.10, priority: 'Medium', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000019' },
      "State Management": { required: 70, weight: 0.05, priority: 'Medium', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000020' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000012",
    name: "Java Developer",
    slug: "java-developer",
    category: "Engineering",
    description: "Enterprise backend development, Spring Framework, microservices, and robust distributed systems.",
    skills: {
      "Java Core": { required: 80, weight: 0.30, priority: 'High', category: 'Backend', skillId: 'skill-java-core' },
      "Spring Boot": { required: 75, weight: 0.25, priority: 'High', category: 'Backend', skillId: 'skill-java-spring' },
      "SQL & Databases": { required: 75, weight: 0.20, priority: 'High', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000003' },
      "REST APIs": { required: 75, weight: 0.15, priority: 'Medium', category: 'Backend', skillId: '40000000-0000-0000-0000-000000000002' },
      "Git & Version Control": { required: 65, weight: 0.10, priority: 'Medium', category: 'Tools', skillId: '40000000-0000-0000-0000-000000000004' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000006",
    name: "Data Analyst",
    slug: "data-analyst",
    category: "Data",
    description: "Transforms business and system data into actionable insights, dashboards, and reporting models.",
    skills: {
      "SQL & Query Optimization": { required: 85, weight: 0.35, priority: 'High', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000003' },
      "Python / Pandas": { required: 80, weight: 0.30, priority: 'High', category: 'Data', skillId: '40000000-0000-0000-0000-000000000012' },
      "Data Visualization (PowerBI/Tableau)": { required: 75, weight: 0.20, priority: 'Medium', category: 'Data', skillId: 'skill-data-viz' },
      "Excel & Statistics": { required: 70, weight: 0.15, priority: 'Medium', category: 'Data', skillId: 'skill-data-stats' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000013",
    name: "Data Scientist",
    slug: "data-scientist",
    category: "Data",
    description: "Builds statistical models, machine learning systems, predictive algorithms, and data pipelines.",
    skills: {
      "Python": { required: 85, weight: 0.30, priority: 'High', category: 'Technical', skillId: '40000000-0000-0000-0000-000000000012' },
      "Machine Learning Fundamentals": { required: 80, weight: 0.30, priority: 'High', category: 'Data', skillId: 'skill-ds-ml' },
      "SQL": { required: 75, weight: 0.20, priority: 'Medium', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000003' },
      "Statistics & Mathematics": { required: 80, weight: 0.20, priority: 'High', category: 'Data', skillId: 'skill-ds-stats' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000005",
    name: "Cloud / DevOps Engineer",
    slug: "devops",
    category: "Operations",
    description: "Automates CI/CD pipelines, container orchestration, and cloud infrastructure reliability.",
    skills: {
      "Linux": { required: 80, weight: 0.35, priority: 'High', category: 'Operations', skillId: 'skill-devops-linux' },
      "Docker": { required: 75, weight: 0.25, priority: 'High', category: 'Operations', skillId: '40000000-0000-0000-0000-000000000005' },
      "AWS / GCP": { required: 70, weight: 0.20, priority: 'Medium', category: 'Operations', skillId: '40000000-0000-0000-0000-000000000011' },
      "CI/CD": { required: 65, weight: 0.20, priority: 'Medium', category: 'Operations', skillId: 'skill-devops-cicd' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000004",
    name: "Cybersecurity Analyst",
    slug: "security",
    category: "Security",
    description: "Protects systems, networks, and data from cyber threats, vulnerabilities, and unauthorized access.",
    skills: {
      "REST API Security": { required: 80, weight: 0.35, priority: 'High', category: 'Security', skillId: '40000000-0000-0000-0000-000000000013' },
      "Python": { required: 70, weight: 0.30, priority: 'High', category: 'Technical', skillId: '40000000-0000-0000-0000-000000000012' },
      "System Design Basics": { required: 65, weight: 0.20, priority: 'Medium', category: 'Technical', skillId: '40000000-0000-0000-0000-000000000014' },
      "Git & Version Control": { required: 60, weight: 0.15, priority: 'Medium', category: 'Tools', skillId: '40000000-0000-0000-0000-000000000004' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000007",
    name: "AI / Machine Learning Engineer",
    slug: "ai-ml",
    category: "Artificial Intelligence",
    description: "Designs, trains, and deploys machine learning models, neural networks, and generative AI systems.",
    skills: {
      "Python": { required: 85, weight: 0.30, priority: 'High', category: 'Technical', skillId: '40000000-0000-0000-0000-000000000012' },
      "Machine Learning Fundamentals": { required: 80, weight: 0.30, priority: 'High', category: 'Data', skillId: 'skill-ai-ml' },
      "Statistics & Mathematics": { required: 75, weight: 0.25, priority: 'Medium', category: 'Data', skillId: 'skill-ai-math' },
      "Model Evaluation & Deployment": { required: 70, weight: 0.15, priority: 'Medium', category: 'Operations', skillId: 'skill-ai-deploy' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000008",
    name: "AI Engineer",
    slug: "ai-engineer",
    category: "Artificial Intelligence",
    description: "Integrates Large Language Models (LLMs), RAG architectures, prompt engineering, and AI microservices.",
    skills: {
      "Python": { required: 85, weight: 0.25, priority: 'High', category: 'Technical', skillId: '40000000-0000-0000-0000-000000000012' },
      "LLM Integration & Prompting": { required: 85, weight: 0.30, priority: 'High', category: 'AI', skillId: 'skill-ai-llm' },
      "Vector Databases & RAG": { required: 80, weight: 0.25, priority: 'High', category: 'Data', skillId: 'skill-ai-rag' },
      "REST APIs & FastApi": { required: 75, weight: 0.20, priority: 'Medium', category: 'Backend', skillId: '40000000-0000-0000-0000-000000000002' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000009",
    name: "Python Developer",
    slug: "python-developer",
    category: "Engineering",
    description: "Builds scalable backend applications, data workflows, APIs with Django/FastAPI, and automated pipelines.",
    skills: {
      "Python Core": { required: 85, weight: 0.35, priority: 'High', category: 'Technical', skillId: '40000000-0000-0000-0000-000000000012' },
      "Django / FastAPI": { required: 80, weight: 0.25, priority: 'High', category: 'Backend', skillId: 'skill-py-framework' },
      "SQL & PostgreSQL": { required: 75, weight: 0.25, priority: 'High', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000003' },
      "Git & Version Control": { required: 65, weight: 0.15, priority: 'Medium', category: 'Tools', skillId: '40000000-0000-0000-0000-000000000004' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000010",
    name: "Software Engineer",
    slug: "software-engineer",
    category: "Engineering",
    description: "Core algorithms, modular software architecture, testing discipline, and scalable system design.",
    skills: {
      "Data Structures & Algorithms": { required: 85, weight: 0.30, priority: 'High', category: 'Computer Science', skillId: 'skill-fs-dsa' },
      "System Design Fundamentals": { required: 75, weight: 0.25, priority: 'High', category: 'Architecture', skillId: '40000000-0000-0000-0000-000000000014' },
      "Clean Code & Unit Testing": { required: 80, weight: 0.25, priority: 'High', category: 'Engineering', skillId: 'skill-clean-code' },
      "Git & CI/CD Basics": { required: 70, weight: 0.20, priority: 'Medium', category: 'Tools', skillId: '40000000-0000-0000-0000-000000000004' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000011",
    name: "Mobile App Developer",
    slug: "mobile-developer",
    category: "Engineering",
    description: "Cross-platform and native mobile applications with React Native, Flutter, offline storage, and responsive UI.",
    skills: {
      "React Native / Flutter": { required: 85, weight: 0.35, priority: 'High', category: 'Mobile', skillId: 'skill-mobile-rn' },
      "JavaScript / TypeScript": { required: 80, weight: 0.25, priority: 'High', category: 'Frontend', skillId: '40000000-0000-0000-0000-000000000015' },
      "Mobile State & Offline Storage": { required: 75, weight: 0.20, priority: 'Medium', category: 'Mobile', skillId: 'skill-mobile-state' },
      "REST API Integration": { required: 75, weight: 0.20, priority: 'Medium', category: 'Backend', skillId: '40000000-0000-0000-0000-000000000002' },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000014",
    name: "Business Analyst",
    slug: "business-analyst",
    category: "Business & Analytics",
    description: "Bridges business requirements and technical execution with data modeling, stakeholder analysis, and SQL.",
    skills: {
      "SQL & Data Extraction": { required: 80, weight: 0.35, priority: 'High', category: 'Databases', skillId: '40000000-0000-0000-0000-000000000003' },
      "Requirement Modeling & Agile": { required: 80, weight: 0.30, priority: 'High', category: 'Process', skillId: 'skill-ba-agile' },
      "Data Visualization & Dashboards": { required: 75, weight: 0.20, priority: 'Medium', category: 'Data', skillId: 'skill-data-viz' },
      "Business Metrics & KPI Analysis": { required: 75, weight: 0.15, priority: 'Medium', category: 'Business', skillId: 'skill-ba-kpi' },
    },
  },
]

export interface CareerRoadmapNode {
  step: number
  title: string
  skillName: string
  description: string
  category: string
  requiredScore?: number
}

export const CAREER_ROADMAPS: Record<string, CareerRoadmapNode[]> = {
  fullstack: [
    { step: 1, title: 'Semantic Web Structure', skillName: 'HTML', category: 'Frontend', description: 'Semantic HTML5, DOM structure, accessibility & SEO standards' },
    { step: 2, title: 'Modern Responsive Layouts', skillName: 'CSS', category: 'Frontend', description: 'Flexbox, CSS Grid, media queries, variables & animations' },
    { step: 3, title: 'JavaScript & ES6+ Mechanics', skillName: 'JavaScript', category: 'Frontend', description: 'Async/await, closures, promises, prototypes & DOM events' },
    { step: 4, title: 'Version Control & Workflows', skillName: 'Git / GitHub', category: 'Tools', description: 'Branching, PR reviews, rebasing, merge conflict resolution' },
    { step: 5, title: 'Component Architecture & State', skillName: 'React.js', category: 'Frontend', description: 'Hooks, custom hooks, context, state management & virtual DOM' },
    { step: 6, title: 'API Integration & Client Networking', skillName: 'REST APIs', category: 'Backend', description: 'HTTP verbs, JSON payloads, headers, error handling & caching' },
    { step: 7, title: 'Server-side Node.js Runtime', skillName: 'Node.js', category: 'Backend', description: 'Event loop, non-blocking I/O, streams, buffers & module system' },
    { step: 8, title: 'Backend Framework & Routing', skillName: 'Express.js', category: 'Backend', description: 'Middleware pipelines, request validation, CORS & error handlers' },
    { step: 9, title: 'Relational & Document Databases', skillName: 'SQL / Databases', category: 'Databases', description: 'Schema design, indexing, ACID transactions, joins & aggregations' },
    { step: 10, title: 'Authentication & Web Security', skillName: 'Authentication', category: 'Security', description: 'JWT tokens, sessions, password hashing (bcrypt), RBAC & HTTPS' },
    { step: 11, title: 'Containerization & Cloud Deploy', skillName: 'Deployment', category: 'Operations', description: 'Docker containerization, CI/CD pipelines, Vercel & cloud hosting' },
    { step: 12, title: 'Algorithmic Problem Solving', skillName: 'Problem Solving / DSA', category: 'Computer Science', description: 'Data structures, algorithm complexity (Big-O) & optimization' },
  ],
  frontend: [
    { step: 1, title: 'Semantic HTML5 Foundations', skillName: 'HTML', category: 'Frontend', description: 'Semantic elements, forms, canvas & accessibility (a11y)' },
    { step: 2, title: 'CSS3 & Modern Styling', skillName: 'CSS', category: 'Frontend', description: 'CSS Grid, Flexbox, custom properties & responsive design systems' },
    { step: 3, title: 'Modern JavaScript (ES6+)', skillName: 'JavaScript', category: 'Frontend', description: 'Functional programming, async JavaScript, event loop & DOM APIs' },
    { step: 4, title: 'Responsive & Mobile Design', skillName: 'Responsive Design', category: 'Frontend', description: 'Mobile-first workflows, viewport units, adaptive layouts' },
    { step: 5, title: 'Git & Collaborative Versioning', skillName: 'Git/GitHub', category: 'Tools', description: 'Feature branching, git flow, pull requests & code collaboration' },
    { step: 6, title: 'React Component Architecture', skillName: 'React', category: 'Frontend', description: 'Component lifecycles, hooks, JSX, memoization & performance' },
    { step: 7, title: 'API Integration & Networking', skillName: 'API Integration', category: 'Frontend', description: 'Fetch/Axios, React Query/SWR, optimistic UI & error boundaries' },
    { step: 8, title: 'Global State Management', skillName: 'State Management', category: 'Frontend', description: 'Zustand, Redux Toolkit, Context API & selector patterns' },
    { step: 9, title: 'Testing & Build Tooling', skillName: 'Testing', category: 'Engineering', description: 'Jest, React Testing Library, Vite/Webpack bundling & bundle analysis' },
    { step: 10, title: 'Advanced Frontend & Next.js', skillName: 'Advanced Frontend', category: 'Architecture', description: 'Server components (RSC), SSR, SSG, web vitals & Edge caching' },
  ],
  backend: [
    { step: 1, title: 'JavaScript / TypeScript Foundations', skillName: 'JavaScript', category: 'Backend', description: 'Type systems, async programming, streams & error handling' },
    { step: 2, title: 'Git & Version Control Mastery', skillName: 'Git & Version Control', category: 'Tools', description: 'Branch management, CI hooks, collaborative code review' },
    { step: 3, title: 'Node.js Runtime & Event Loop', skillName: 'Node.js', category: 'Backend', description: 'Asynchronous event loop, worker threads, buffer & fs modules' },
    { step: 4, title: 'RESTful API Standards & Routing', skillName: 'REST APIs', category: 'Backend', description: 'HTTP protocol, REST standards, status codes, Zod validation' },
    { step: 5, title: 'Relational Database Engineering', skillName: 'SQL', category: 'Databases', description: 'PostgreSQL, normalization, joins, indexes, query plans & migrations' },
    { step: 6, title: 'Authentication & Access Control', skillName: 'Authentication', category: 'Security', description: 'JWT, OAuth2, session store, cookie security & RBAC policies' },
    { step: 7, title: 'Containerization with Docker', skillName: 'Docker', category: 'Operations', description: 'Dockerfile creation, multi-stage builds & compose networks' },
    { step: 8, title: 'System Architecture & Caching', skillName: 'System Design', category: 'Architecture', description: 'Redis caching, message queues, rate limiting & microservices' },
  ],
  'ai-ml': [
    { step: 1, title: 'Python Core & Scientific Computing', skillName: 'Python', category: 'Technical', description: 'OOP, generators, decorators, NumPy vectorized calculations' },
    { step: 2, title: 'Linear Algebra & Calculus', skillName: 'Mathematics', category: 'Data', description: 'Matrix operations, eigenvalues, partial derivatives & gradients' },
    { step: 3, title: 'Probability & Applied Statistics', skillName: 'Statistics & Mathematics', category: 'Data', description: 'Distributions, hypothesis testing, Bayes theorem, p-values' },
    { step: 4, title: 'Data Wrangling & Exploration', skillName: 'Data Handling', category: 'Data', description: 'Pandas dataframes, data cleaning, feature encoding & imputation' },
    { step: 5, title: 'Machine Learning Fundamentals', skillName: 'Machine Learning Fundamentals', category: 'Data', description: 'Regression, classification, decision trees, random forests, SVM' },
    { step: 6, title: 'Deep Learning & Neural Networks', skillName: 'Deep Learning', category: 'AI', description: 'Backpropagation, activation functions, PyTorch/TensorFlow models' },
    { step: 7, title: 'Computer Vision & NLP', skillName: 'Neural Networks', category: 'AI', description: 'CNNs, RNNs, transformers, tokenization, attention mechanisms' },
    { step: 8, title: 'Model Evaluation & Validation', skillName: 'Model Evaluation & Deployment', category: 'Operations', description: 'Cross-validation, ROC-AUC, F1-score, bias-variance tradeoff' },
    { step: 9, title: 'Generative AI & LLMs', skillName: 'Generative AI', category: 'AI', description: 'Fine-tuning, prompt design, embeddings, diffusion models' },
    { step: 10, title: 'AI Production Deployment', skillName: 'Deployment', category: 'Operations', description: 'Model serving via FastAPI, Triton, ONNX & cloud GPU hosting' },
  ],
  'ai-engineer': [
    { step: 1, title: 'Python & Async Engineering', skillName: 'Python', category: 'Technical', description: 'Asyncio, typing, API client development & fast prototyping' },
    { step: 2, title: 'Prompt Engineering & System Directives', skillName: 'LLM Integration & Prompting', category: 'AI', description: 'Few-shot prompting, structured outputs, CoT reasoning' },
    { step: 3, title: 'Embeddings & Vector Databases', skillName: 'Vector Databases & RAG', category: 'Data', description: 'Vector math, similarity search, pgvector, Pinecone & Chroma' },
    { step: 4, title: 'RAG Architecture & Document Ingestion', skillName: 'RAG Pipeline', category: 'AI', description: 'Chunking strategies, hybrid search, re-ranking & context caching' },
    { step: 5, title: 'FastAPI Backend & Tool Calling', skillName: 'REST APIs & FastApi', category: 'Backend', description: 'Streaming responses, function calling / tool integrations, schemas' },
    { step: 6, title: 'Autonomous AI Agents', skillName: 'AI Agents', category: 'AI', description: 'Multi-agent coordination, memory management, LangGraph / CrewAI' },
    { step: 7, title: 'LLM Evaluation & Observability', skillName: 'AI Evaluation', category: 'Operations', description: 'Guardrails, latency profiling, token optimization & LangSmith' },
  ],
  security: [
    { step: 1, title: 'Linux & OS Internals', skillName: 'Linux', category: 'Systems', description: 'Permissions, processes, shell scripting, auditing & PAM configuration' },
    { step: 2, title: 'Network Protocols & Packet Analysis', skillName: 'Networking', category: 'Security', description: 'TCP/IP, UDP, DNS, TLS/SSL handshakes, Wireshark packet capture' },
    { step: 3, title: 'Web & API Security Benchmark', skillName: 'REST API Security', category: 'Security', description: 'OWASP Top 10, SQLi, XSS, CSRF, JWT cracking & CORS defenses' },
    { step: 4, title: 'Python Security Automation', skillName: 'Python', category: 'Technical', description: 'Custom port scanners, vulnerability probes, log parsers' },
    { step: 5, title: 'System Design & Threat Modeling', skillName: 'System Design Basics', category: 'Technical', description: 'STRIDE modeling, zero-trust architecture, attack surface minimization' },
    { step: 6, title: 'SIEM & Incident Detection', skillName: 'Incident Response', category: 'Operations', description: 'Splunk, Elastic SIEM, log correlation, anomaly alerts & triage' },
    { step: 7, title: 'Penetration Testing & Reporting', skillName: 'Penetration Testing', category: 'Security', description: 'Burp Suite, Metasploit, ethical disclosure & risk remediation' },
  ],
  'data-analyst': [
    { step: 1, title: 'Spreadsheet Modeling & Statistics', skillName: 'Excel & Statistics', category: 'Data', description: 'Pivot tables, VLOOKUP/XLOOKUP, hypothesis testing & descriptive stats' },
    { step: 2, title: 'SQL Relational Querying', skillName: 'SQL & Query Optimization', category: 'Databases', description: 'Aggregations, group by, joins, CASE statements & subqueries' },
    { step: 3, title: 'Advanced SQL & Window Functions', skillName: 'SQL Analytics', category: 'Databases', description: 'ROW_NUMBER, RANK, LEAD/LAG, rolling averages, CTEs & indexing' },
    { step: 4, title: 'Python for Data Analysis', skillName: 'Python / Pandas', category: 'Data', description: 'Pandas dataframes, NumPy arrays, data cleaning & transformation' },
    { step: 5, title: 'Interactive BI Dashboards', skillName: 'Data Visualization (PowerBI/Tableau)', category: 'Data', description: 'PowerBI DAX, Tableau calculated fields, storytelling & KPI design' },
    { step: 6, title: 'Business Reporting & Stakeholder Presentation', skillName: 'Business Reporting', category: 'Business', description: 'Executive summaries, automated email reports, metric anomalies' },
  ],
  'data-scientist': [
    { step: 1, title: 'Python & Numerical Foundations', skillName: 'Python', category: 'Technical', description: 'Vectorized computing, OOP, data processing libraries' },
    { step: 2, title: 'Statistical Inference & Probability', skillName: 'Statistics & Mathematics', category: 'Data', description: 'Bayesian statistics, distribution modeling, multivariate regression' },
    { step: 3, title: 'Data Extraction & SQL Engineering', skillName: 'SQL', category: 'Databases', description: 'Complex relational extraction, data warehouse querying (Snowflake/BigQuery)' },
    { step: 4, title: 'Exploratory Data Analysis & Feature Engineering', skillName: 'Feature Engineering', category: 'Data', description: 'Dimensionality reduction (PCA), feature scaling, categorical encoding' },
    { step: 5, title: 'Predictive Machine Learning Modeling', skillName: 'Machine Learning Fundamentals', category: 'Data', description: 'Supervised & unsupervised models, hyperparameter tuning (Optuna)' },
    { step: 6, title: 'Deep Learning & Neural Architectures', skillName: 'Deep Learning', category: 'AI', description: 'PyTorch models, embeddings, transfer learning & model explainability' },
    { step: 7, title: 'Production Data Pipelines & MLOps', skillName: 'MLOps', category: 'Operations', description: 'MLflow tracking, model registry, automated retraining pipelines' },
  ],
  devops: [
    { step: 1, title: 'Linux Administration & Shell', skillName: 'Linux', category: 'Operations', description: 'Bash scripting, user management, systemd, SSH & cron management' },
    { step: 2, title: 'Git Workflows & Collaborative Ops', skillName: 'Git', category: 'Tools', description: 'Monorepo workflows, semantic release, git hooks & branch protection' },
    { step: 3, title: 'Docker Containerization', skillName: 'Docker', category: 'Operations', description: 'Multi-stage builds, rootless containers, docker networking & compose' },
    { step: 4, title: 'Continuous Integration & Deployment', skillName: 'CI/CD', category: 'Operations', description: 'GitHub Actions, automated test suites, artifact caching & CD deploy' },
    { step: 5, title: 'Cloud Infrastructure Architecture', skillName: 'AWS / GCP', category: 'Operations', description: 'VPC, EC2/Compute, S3/GCS, IAM roles, load balancers & DNS' },
    { step: 6, title: 'Infrastructure as Code (IaC)', skillName: 'Terraform', category: 'Operations', description: 'Terraform modules, state locking, declarative cloud provisioning' },
    { step: 7, title: 'Kubernetes Container Orchestration', skillName: 'Kubernetes', category: 'Operations', description: 'Pods, Deployments, Services, Ingress, Helm charts & RBAC' },
    { step: 8, title: 'Observability & Monitoring', skillName: 'Monitoring', category: 'Operations', description: 'Prometheus metrics, Grafana dashboards, log aggregation & alerts' },
  ],
  'java-developer': [
    { step: 1, title: 'Java Core & Modern OOP Mechanics', skillName: 'Java Core', category: 'Backend', description: 'Collections framework, generics, streams API, concurrency & JVM memory' },
    { step: 2, title: 'Git & Version Control Workflows', skillName: 'Git & Version Control', category: 'Tools', description: 'Git branching, rebase strategies, collaborative pull requests' },
    { step: 3, title: 'Relational Databases & JPA/Hibernate', skillName: 'SQL & Databases', category: 'Databases', description: 'SQL joins, JPA entity relationships, connection pools (HikariCP)' },
    { step: 4, title: 'Spring Boot Application Framework', skillName: 'Spring Boot', category: 'Backend', description: 'Dependency injection, Spring MVC, auto-configuration & Spring Security' },
    { step: 5, title: 'RESTful Microservices & Architecture', skillName: 'REST APIs', category: 'Backend', description: 'REST APIs, DTO patterns, OpenAPI documentation & validation' },
    { step: 6, title: 'Testing & Quality Assurance', skillName: 'Unit Testing', category: 'Engineering', description: 'JUnit 5, Mockito, Testcontainers integration testing' },
    { step: 7, title: 'Dockerizing & Cloud Deployment', skillName: 'Deployment', category: 'Operations', description: 'Containerizing Spring JARs, Kubernetes deployment manifests & CI/CD' },
  ],
  'python-developer': [
    { step: 1, title: 'Python Core & Advanced Mechanics', skillName: 'Python Core', category: 'Technical', description: 'OOP, generators, decorators, context managers, typing & pytest' },
    { step: 2, title: 'Git & Team Version Control', skillName: 'Git & Version Control', category: 'Tools', description: 'Feature branches, merge strategies & pre-commit hooks' },
    { step: 3, title: 'SQL & Relational Database Design', skillName: 'SQL & PostgreSQL', category: 'Databases', description: 'PostgreSQL queries, SQLAlchemy ORM, Alembic schema migrations' },
    { step: 4, title: 'Django & FastAPI Web Frameworks', skillName: 'Django / FastAPI', category: 'Backend', description: 'MVC/MTV architecture, Pydantic schemas, dependency injection, routing' },
    { step: 5, title: 'REST API Architecture & Auth', skillName: 'REST APIs', category: 'Backend', description: 'REST standards, JWT tokens, CORS, OAuth2 & rate-limiting' },
    { step: 6, title: 'Asynchronous Tasks & Queues', skillName: 'Celery / Redis', category: 'Backend', description: 'Asyncio, Celery workers, Redis message broker & task scheduling' },
    { step: 7, title: 'Dockerization & Cloud Production', skillName: 'Deployment', category: 'Operations', description: 'Dockerizing Python apps, Gunicorn/Uvicorn workers, CI/CD pipelines' },
  ],
  'software-engineer': [
    { step: 1, title: 'Data Structures & Algorithmic Foundations', skillName: 'Data Structures & Algorithms', category: 'Computer Science', description: 'Trees, graphs, dynamic programming, hashing, time/space complexity' },
    { step: 2, title: 'Git & Professional Workflows', skillName: 'Git & CI/CD Basics', category: 'Tools', description: 'Branch management, code review discipline, release tagging' },
    { step: 3, title: 'Clean Architecture & Unit Testing', skillName: 'Clean Code & Unit Testing', category: 'Engineering', description: 'SOLID principles, design patterns, TDD discipline & mocking' },
    { step: 4, title: 'Relational & Distributed Databases', skillName: 'Database Management', category: 'Databases', description: 'ACID guarantees, indexing strategies, CAP theorem & replication' },
    { step: 5, title: 'System Design & Scalability Basics', skillName: 'System Design Fundamentals', category: 'Architecture', description: 'Load balancers, caching strategies, horizontal scaling & microservices' },
    { step: 6, title: 'CI/CD Pipelines & Cloud Systems', skillName: 'Cloud & CI/CD', category: 'Operations', description: 'Automated deployment pipelines, containerization & production monitoring' },
  ],
  'mobile-developer': [
    { step: 1, title: 'JavaScript & TypeScript Mastery', skillName: 'JavaScript / TypeScript', category: 'Frontend', description: 'ES6+ syntax, TypeScript strict typing, async/await & modules' },
    { step: 2, title: 'Cross-Platform Framework Fundamentals', skillName: 'React Native / Flutter', category: 'Mobile', description: 'Core components, JSX/Widgets, navigation stacks & lifecycle' },
    { step: 3, title: 'Responsive Mobile UI & Styling', skillName: 'Mobile UI', category: 'Mobile', description: 'Flexbox mobile styling, safe areas, animations & gestures' },
    { step: 4, title: 'Mobile State & Offline Persistence', skillName: 'Mobile State & Offline Storage', category: 'Mobile', description: 'AsyncStorage, SQLite, Zustand/Redux & offline-first synchronization' },
    { step: 5, title: 'REST API & Networking Integration', skillName: 'REST API Integration', category: 'Backend', description: 'Network interceptors, token refresh, image caching & error screens' },
    { step: 6, title: 'Native Device Capabilities', skillName: 'Native Modules', category: 'Mobile', description: 'Camera access, geolocation, biometric auth & push notifications' },
    { step: 7, title: 'App Store & Play Store Deployment', skillName: 'App Store Deployment', category: 'Operations', description: 'Code signing, build variants, Fastlane & App Store submission' },
  ],
  'business-analyst': [
    { step: 1, title: 'Business Process & Agile Modeling', skillName: 'Requirement Modeling & Agile', category: 'Process', description: 'User stories, acceptance criteria, BPMN workflows & Jira/Scrum' },
    { step: 2, title: 'SQL & Relational Data Extraction', skillName: 'SQL & Data Extraction', category: 'Databases', description: 'Data querying, joins, aggregation, cohort extraction & export' },
    { step: 3, title: 'Business Metrics & KPI Analysis', skillName: 'Business Metrics & KPI Analysis', category: 'Business', description: 'CAC, LTV, churn rate, ROI modeling, unit economics & funnels' },
    { step: 4, title: 'Interactive BI Dashboards & Storytelling', skillName: 'Data Visualization & Dashboards', category: 'Data', description: 'PowerBI, Tableau, executive reporting & actionable insights' },
    { step: 5, title: 'Stakeholder Communication & BRD', skillName: 'Stakeholder Management', category: 'Business', description: 'Business Requirement Documents (BRD), gap analysis & signoffs' },
  ],
}

export function getCareerRoadmap(careerIdOrSlug: string): CareerRoadmapNode[] {
  if (!careerIdOrSlug) return CAREER_ROADMAPS.fullstack

  const query = careerIdOrSlug.trim().toLowerCase()
  const clean = query.replace(/[-_]/g, '')

  // Exact slug match
  if (CAREER_ROADMAPS[query]) return CAREER_ROADMAPS[query]

  // Find benchmark
  const matched = findCareerBenchmark(query)
  if (matched && CAREER_ROADMAPS[matched.slug]) {
    return CAREER_ROADMAPS[matched.slug]
  }

  // Substring match on slugs
  for (const [slug, nodes] of Object.entries(CAREER_ROADMAPS)) {
    if (clean.includes(slug.replace(/[-_]/g, '')) || slug.replace(/[-_]/g, '').includes(clean)) {
      return nodes
    }
  }

  // Generate fallback roadmap from profile skills if defined
  if (matched) {
    return Object.entries(matched.skills).map(([name, b], idx) => ({
      step: idx + 1,
      title: `${name} Mastery`,
      skillName: name,
      category: b.category || 'Technical',
      description: `Target benchmark proficiency: ${b.required}/100 for ${matched.name}`,
      requiredScore: b.required,
    }))
  }

  return CAREER_ROADMAPS.fullstack
}

export function findCareerBenchmark(query: string): CareerBenchmarkProfile | null {
  if (!query) return null
  const raw = query.trim().toLowerCase()
  const clean = raw.replace(/[-_]/g, '')
  return (
    CAREER_BENCHMARK_PROFILES.find(
      c => c.id === query ||
           c.slug.toLowerCase() === raw ||
           c.name.toLowerCase() === raw ||
           c.slug.toLowerCase().replace(/[-_]/g, '') === clean ||
           clean.includes(c.slug.toLowerCase().replace(/[-_]/g, '')) ||
           c.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(clean)
    ) || null
  )
}

export interface ComputedReadiness {
  careerId: string
  careerName: string
  readinessPercentage: number
  readinessCategory: "Ready" | "Needs Improvement" | "Critical Gap"
  readinessVariant: "success" | "warning" | "critical"
  priorityGap: {
    skillName: string
    required: number
    verified: number
    gap: number
    category: "Ready" | "Needs Improvement" | "Critical Gap"
    recommendation: string
  } | null
  skills: Array<{
    skillId: string
    skillName: string
    currentLevel: number
    selfDeclaredLevel?: number
    requiredLevel: number
    gap: number
    importance: "High" | "Medium" | "Low"
    isAssessed: boolean
    status: "ready" | "improve" | "critical"
    verificationStatus: string
  }>
}

/**
 * Calculates Career Readiness deterministically:
 * Formula: sum( (min(StudentVerifiedScore, RequiredScore) / RequiredScore) * Weight ) * 100
 * Strictly adheres to Zero-Inflation: Self-declared skills receive 0 verified credit.
 */
export function computeDeterministicReadiness(
  profile: CareerBenchmarkProfile,
  studentScores: Record<string, number | { score: number; verifiedStatus?: string }> = {}
): ComputedReadiness {
  let weightedScore = 0
  let totalWeight = 0
  let maxDeficit = -Infinity
  let prioritySkillName = Object.keys(profile.skills)[0] || "General"

  const skillEntries = Object.entries(profile.skills)

  const formattedSkills = skillEntries.map(([skillName, config], idx) => {
    const rawData = studentScores[skillName] ?? studentScores[skillName.toLowerCase()]
    const rawScore = typeof rawData === 'number' ? rawData : (rawData && typeof rawData.score === 'number' ? rawData.score : 0)
    const verifiedStatus = typeof rawData === 'object' && rawData?.verifiedStatus ? rawData.verifiedStatus : "self_declared"

    // Strict verification rule: Only assessment, practical, evidence, or institution verified scores count toward readiness
    const isTrulyVerified = verifiedStatus === 'assessment_verified' ||
      verifiedStatus === 'practical_verified' ||
      verifiedStatus === 'evidence_verified' ||
      verifiedStatus === 'institution_verified' ||
      verifiedStatus === 'academic_verified'

    const currentLevel = isTrulyVerified ? rawScore : 0
    const isAssessed = isTrulyVerified && currentLevel > 0
    const deficit = config.required - currentLevel
    const gap = Math.max(deficit, 0)

    if (deficit > maxDeficit) {
      maxDeficit = deficit
      prioritySkillName = skillName
    }

    if (isAssessed) {
      const ratio = Math.min(currentLevel / config.required, 1.0)
      weightedScore += ratio * config.weight
    }
    totalWeight += config.weight

    const status: "ready" | "improve" | "critical" =
      deficit <= 0 ? "ready" : deficit > 20 ? "critical" : "improve"

    return {
      skillId: config.skillId || `skill-${profile.slug}-${idx + 1}`,
      skillName,
      currentLevel: isTrulyVerified ? currentLevel : 0,
      selfDeclaredLevel: !isTrulyVerified ? rawScore : undefined,
      requiredLevel: config.required,
      gap,
      importance: (config.weight >= 0.15 ? "High" : config.weight >= 0.08 ? "Medium" : "Low") as "High" | "Medium" | "Low",
      isAssessed,
      status,
      verificationStatus: verifiedStatus,
    }
  })

  const readinessPercentage = Math.round((weightedScore / (totalWeight || 1)) * 100)
  const readinessCategory: "Ready" | "Needs Improvement" | "Critical Gap" =
    readinessPercentage === 0 ? "Critical Gap" : maxDeficit > 20 ? "Critical Gap" : maxDeficit > 5 ? "Needs Improvement" : "Ready"
  const readinessVariant: "success" | "warning" | "critical" =
    readinessCategory === "Ready" ? "success" : readinessCategory === "Needs Improvement" ? "warning" : "critical"

  const priorityConfig = profile.skills[prioritySkillName]
  const priorityRaw = studentScores[prioritySkillName] ?? studentScores[prioritySkillName.toLowerCase()]
  const priorityScore = typeof priorityRaw === 'number' ? priorityRaw : (priorityRaw && typeof priorityRaw.score === 'number' ? priorityRaw.score : 0)
  const priorityVerified = (typeof priorityRaw === 'object' && priorityRaw?.verifiedStatus && priorityRaw.verifiedStatus !== 'self_declared') ? priorityScore : 0
  const priorityGapVal = priorityConfig ? Math.max(priorityConfig.required - priorityVerified, 0) : 0

  const priorityGap = priorityConfig
    ? {
        skillName: prioritySkillName,
        required: priorityConfig.required,
        verified: priorityVerified,
        gap: priorityGapVal,
        category: priorityGapVal > 20 ? ("Critical Gap" as const) : priorityGapVal > 5 ? ("Needs Improvement" as const) : ("Ready" as const),
        recommendation: `Focus on establishing or improving verified competency in ${prioritySkillName}. Complete the targeted assessment to satisfy the ${priorityConfig.required} pt role benchmark.`,
      }
    : null

  return {
    careerId: profile.id,
    careerName: profile.name,
    readinessPercentage,
    readinessCategory,
    readinessVariant,
    priorityGap,
    skills: formattedSkills,
  }
}

export const CANONICAL_SKILLS = [
  { id: '40000000-0000-0000-0000-000000000001', name: 'Node.js', slug: 'nodejs', category: 'Backend & APIs' },
  { id: '40000000-0000-0000-0000-000000000002', name: 'REST APIs', slug: 'rest-apis', category: 'Backend & APIs' },
  { id: '40000000-0000-0000-0000-000000000003', name: 'SQL', slug: 'sql', category: 'Databases & Infrastructure' },
  { id: '40000000-0000-0000-0000-000000000004', name: 'Git & Version Control', slug: 'git', category: 'Tools & DevOps' },
  { id: '40000000-0000-0000-0000-000000000005', name: 'Docker', slug: 'docker', category: 'Tools & DevOps' },
  { id: '40000000-0000-0000-0000-000000000006', name: 'React', slug: 'react', category: 'Frontend Basics' },
  { id: '40000000-0000-0000-0000-000000000016', name: 'HTML', slug: 'html', category: 'Frontend Basics' },
  { id: '40000000-0000-0000-0000-000000000017', name: 'CSS', slug: 'css', category: 'Frontend Basics' },
  { id: '40000000-0000-0000-0000-000000000012', name: 'Python', slug: 'python', category: 'Data & Security' },
  { id: '40000000-0000-0000-0000-000000000013', name: 'Security Fundamentals', slug: 'security', category: 'Data & Security' },
  { id: '40000000-0000-0000-0000-000000000014', name: 'System Design', slug: 'system-design', category: 'Backend & APIs' },
  { id: '40000000-0000-0000-0000-000000000015', name: 'JavaScript', slug: 'javascript', category: 'Frontend Basics' },
]
