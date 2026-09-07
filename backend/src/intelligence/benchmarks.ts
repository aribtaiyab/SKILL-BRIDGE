export interface SkillBenchmark {
  required: number
  weight: number
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
    id: "30000000-0000-0000-0000-000000000001",
    name: "Backend Developer (Internship/Junior)",
    slug: "backend",
    category: "Engineering",
    description: "Focuses on server-side logic, database management, and resilient REST API integration.",
    skills: {
      "Node.js": { required: 80, weight: 0.35 },
      "REST APIs": { required: 75, weight: 0.25 },
      "SQL": { required: 70, weight: 0.25 },
      "Git & Version Control": { required: 60, weight: 0.15 },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000002",
    name: "Frontend Developer",
    slug: "frontend",
    category: "Engineering",
    description: "Specializes in modern React user interfaces, client-side rendering, and responsive styling.",
    skills: {
      "React.js": { required: 80, weight: 0.35 },
      "JavaScript / TypeScript": { required: 75, weight: 0.25 },
      "Tailwind CSS / HTML": { required: 70, weight: 0.20 },
      "Git & GitHub": { required: 65, weight: 0.20 },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000003",
    name: "Full Stack Engineer",
    slug: "fullstack",
    category: "Engineering",
    description: "Covers end-to-end web development across modern frontend, backend services, and databases.",
    skills: {
      "React.js": { required: 75, weight: 0.25 },
      "Node.js & Express": { required: 75, weight: 0.25 },
      "PostgreSQL / Database Design": { required: 70, weight: 0.25 },
      "Docker & Deployment": { required: 60, weight: 0.25 },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000006",
    name: "Data Analyst",
    slug: "data-analyst",
    category: "Data",
    description: "Transforms business and system data into actionable insights, dashboards, and reporting models.",
    skills: {
      "SQL & Query Optimization": { required: 85, weight: 0.35 },
      "Python / Pandas": { required: 80, weight: 0.30 },
      "Data Visualization (PowerBI/Tableau)": { required: 75, weight: 0.20 },
      "Excel & Statistics": { required: 70, weight: 0.15 },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000004",
    name: "Cybersecurity Analyst",
    slug: "security",
    category: "Security",
    description: "Protects systems, networks, and data from cyber threats, vulnerabilities, and unauthorized access.",
    skills: {
      "REST API Security": { required: 80, weight: 0.35 },
      "Python": { required: 70, weight: 0.30 },
      "System Design Basics": { required: 65, weight: 0.20 },
      "Git & Version Control": { required: 60, weight: 0.15 },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000005",
    name: "Cloud / DevOps Engineer",
    slug: "devops",
    category: "Operations",
    description: "Automates CI/CD pipelines, container orchestration, and cloud infrastructure reliability.",
    skills: {
      "Linux": { required: 80, weight: 0.35 },
      "Docker": { required: 75, weight: 0.25 },
      "AWS / GCP": { required: 70, weight: 0.20 },
      "CI/CD": { required: 65, weight: 0.20 },
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000007",
    name: "AI / Machine Learning Engineer",
    slug: "ai-ml",
    category: "Artificial Intelligence",
    description: "Designs, trains, and deploys machine learning models, neural networks, and generative AI systems.",
    skills: {
      "Python": { required: 85, weight: 0.30 },
      "Machine Learning Fundamentals": { required: 80, weight: 0.30 },
      "Statistics & Mathematics": { required: 75, weight: 0.25 },
      "Model Evaluation & Deployment": { required: 70, weight: 0.15 },
    },
  },
]

export function findCareerBenchmark(query: string): CareerBenchmarkProfile | null {
  if (!query) return null
  const q = query.trim().toLowerCase()
  return (
    CAREER_BENCHMARK_PROFILES.find(
      c => c.id === query || c.slug.toLowerCase() === q || c.name.toLowerCase() === q
    ) || null
  )
}
