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
]

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
