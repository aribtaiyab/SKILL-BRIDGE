export interface CohortMetric {
  skill: string;
  category: string;
  cohortAvg: number;
  industryBenchmark: number;
  status: 'Critical Gap' | 'Needs Improvement' | 'Ready';
}

export interface StudentRecord {
  id: string;
  name: string;
  rollNo: string;
  department: string;
  targetRole: string;
  criticalGap: string;
  readiness: number;
  evidencePending: boolean;
  projectTitle?: string;
  repoUrl?: string;
  liveUrl?: string;
  verificationBadge?: string;
}

export interface Intervention {
  id: string;
  title: string;
  targetRole: string;
  affectedStudents: number;
  mentor: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  date: string;
  linkedAssessment?: string;
}

export interface FacultyOpportunity {
  id: string;
  title: string;
  provider: string;
  type: 'FDP' | 'Industrial Training' | 'Consultancy / Research' | 'Guest Lecture';
  duration: string;
  stipendOrGrant?: string;
  deadline: string;
  description?: string;
}

export const DEMO_ACADEMIA_DATA = {
  kpis: {
    placementReadiness: 74,
    totalAssessed: 482,
    totalCohort: 520,
    criticalGapsCount: 2,
    activeWorkshops: 3
  },
  skillGaps: [
    { skill: "Node.js & Async APIs", category: "Backend", cohortAvg: 52, industryBenchmark: 80, status: 'Critical Gap' },
    { skill: "PostgreSQL & Complex Queries", category: "Database", cohortAvg: 74, industryBenchmark: 70, status: 'Ready' },
    { skill: "Data Structures & Algos", category: "Core CS", cohortAvg: 78, industryBenchmark: 75, status: 'Ready' },
    { skill: "Docker & Containerization", category: "DevOps", cohortAvg: 42, industryBenchmark: 65, status: 'Critical Gap' },
    { skill: "React & State Architecture", category: "Frontend", cohortAvg: 68, industryBenchmark: 75, status: 'Needs Improvement' }
  ] as CohortMetric[],
  students: [
    { 
      id: "std-1", 
      name: "Arib Tayab", 
      rollNo: "2025CSE1042", 
      department: "CSE", 
      targetRole: "Backend Developer Intern", 
      criticalGap: "Node.js & APIs", 
      readiness: 65, 
      evidencePending: true, 
      projectTitle: "Distributed Job Scheduler", 
      repoUrl: "https://github.com/example/scheduler",
      liveUrl: "https://scheduler-demo.vercel.app",
      verificationBadge: "Pending Review"
    },
    { 
      id: "std-2", 
      name: "Pooja Verma", 
      rollNo: "2025CSE1088", 
      department: "CSE", 
      targetRole: "Full Stack Engineer", 
      criticalGap: "Docker & Deployment", 
      readiness: 58, 
      evidencePending: false,
      verificationBadge: "Assessment Verified"
    },
    { 
      id: "std-3", 
      name: "Rohan Kulkarni", 
      rollNo: "2025CSE1015", 
      department: "CSE", 
      targetRole: "Data Analyst", 
      criticalGap: "PowerBI Analytics", 
      readiness: 71, 
      evidencePending: true, 
      projectTitle: "Healthcare Data Pipeline", 
      repoUrl: "https://github.com/example/pipeline",
      liveUrl: "https://pipeline-analytics.vercel.app",
      verificationBadge: "Pending Review"
    },
    { 
      id: "std-4", 
      name: "Sneha Nair", 
      rollNo: "2025CSE1120", 
      department: "CSE", 
      targetRole: "Cloud Engineer", 
      criticalGap: "Kubernetes & CI/CD", 
      readiness: 48, 
      evidencePending: false,
      verificationBadge: "Self-Declared"
    },
    {
      id: "std-5",
      name: "Kabir Mehta",
      rollNo: "2025CSE1067",
      department: "CSE",
      targetRole: "Backend Developer Intern",
      criticalGap: "Microservices Design",
      readiness: 45,
      evidencePending: true,
      projectTitle: "Event-Driven Order Queue",
      repoUrl: "https://github.com/example/order-queue",
      verificationBadge: "Pending Review"
    }
  ] as StudentRecord[],
  interventions: [
    { 
      id: "int-1", 
      title: "Weekend REST API & Express Intensive", 
      targetRole: "Backend Developers", 
      affectedStudents: 78, 
      mentor: "Dr. Arvind Gupta", 
      status: "In Progress", 
      date: "Sep 12-14, 2026",
      linkedAssessment: "REST API Architecture Benchmark"
    },
    { 
      id: "int-2", 
      title: "Docker & Containerization Essentials", 
      targetRole: "Cloud & DevOps", 
      affectedStudents: 54, 
      mentor: "Prof. Sunita Rao", 
      status: "Scheduled", 
      date: "Sep 20-21, 2026",
      linkedAssessment: "Container Orchestration Hands-on Lab"
    },
    {
      id: "int-3",
      title: "Database Indexing & Query Tuning Workshop",
      targetRole: "Backend Developers",
      affectedStudents: 62,
      mentor: "Dr. Meenakshi Sharma",
      status: "Completed",
      date: "Aug 28-30, 2026",
      linkedAssessment: "SQL Performance Tuning Practical"
    }
  ] as Intervention[],
  facultyOpportunities: [
    { 
      id: "fac-1", 
      title: "Applied Distributed Microservices FDP", 
      provider: "AWS Academic Initiative", 
      type: "FDP", 
      duration: "5 Days (Virtual)", 
      deadline: "Sep 18, 2026",
      description: "Hands-on architectural faculty development program covering serverless patterns, event queues, and fault-tolerant cloud APIs."
    },
    { 
      id: "fac-2", 
      title: "Faculty Summer Industry Immersion", 
      provider: "Infosys Labs", 
      type: "Industrial Training", 
      duration: "2 Weeks (Bangalore)", 
      deadline: "Sep 30, 2026",
      description: "Direct faculty immersion inside production engineering teams working on high-throughput FinTech pipelines."
    },
    { 
      id: "fac-3", 
      title: "AI-Powered Smart Grid Analytics", 
      provider: "Tata Power R&D", 
      type: "Consultancy / Research", 
      duration: "6 Months", 
      stipendOrGrant: "₹4,50,000 Grant", 
      deadline: "Oct 15, 2026",
      description: "Industry-sponsored collaborative research grant for real-time anomaly detection in smart grid power distribution."
    },
    {
      id: "fac-4",
      title: "Scaling Distributed Systems Architecture",
      provider: "Google Developer Experts",
      type: "Guest Lecture",
      duration: "Half-Day Session",
      deadline: "Sep 25, 2026",
      description: "Industry guest lecture and seminar invitation for Computer Science faculty and pre-final year cohorts."
    }
  ] as FacultyOpportunity[]
};
