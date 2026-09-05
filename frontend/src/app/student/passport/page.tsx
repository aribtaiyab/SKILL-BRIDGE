"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useDemo } from '@/lib/demo/demo-context';

interface SkillItem {
  name: string;
  category: string;
  score: number;
  verificationLevel: 'Self-Declared' | 'Assessment Verified' | 'Practical Verified' | 'Evidence Verified';
  lastEvaluated: string;
}

interface ProjectItem {
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
  verifiedStatus: string;
}

interface PassportProfile {
  name: string;
  collegeName: string;
  department: string;
  course: string;
  year: string;
  targetRole: string;
  passportId: string;
  readinessScore: number;
  skills: SkillItem[];
  projects: ProjectItem[];
}

const defaultProfile: PassportProfile = {
  name: "Arib Tayab",
  collegeName: "Delhi Technological University (DTU)",
  department: "Computer Science & Engineering",
  course: "B.Tech in Computer Science",
  year: "2nd Year (4th Semester)",
  targetRole: "Backend Developer Internship",
  passportId: "SKILL-2026-IN-8491",
  readinessScore: 82,
  skills: [
    { name: "Node.js & Express", category: "Backend", score: 82, verificationLevel: "Practical Verified", lastEvaluated: "Aug 2026" },
    { name: "REST API Design", category: "Backend", score: 78, verificationLevel: "Practical Verified", lastEvaluated: "Aug 2026" },
    { name: "PostgreSQL & Database Design", category: "Database", score: 85, verificationLevel: "Assessment Verified", lastEvaluated: "Jul 2026" },
    { name: "Data Structures & Algorithms", category: "Core CS", score: 76, verificationLevel: "Assessment Verified", lastEvaluated: "Jul 2026" },
    { name: "Git & Version Control", category: "DevOps & Tools", score: 88, verificationLevel: "Evidence Verified", lastEvaluated: "Aug 2026" },
    { name: "React.js & Tailwind CSS", category: "Frontend", score: 70, verificationLevel: "Self-Declared", lastEvaluated: "Pending" }
  ],
  projects: [
    {
      title: "Scalable Task Automation Engine",
      description: "Distributed job execution service with Redis background queues and role-based JWT access.",
      tags: ["Node.js", "Redis", "PostgreSQL", "Express"],
      githubUrl: "https://github.com",
      liveUrl: "https://demo.vercel.app",
      verifiedStatus: "Practical Verified"
    },
    {
      title: "Campus Academic Resource Hub",
      description: "Centralized lab and seminar hall booking platform with real-time slot conflict resolution.",
      tags: ["TypeScript", "Next.js", "Tailwind CSS"],
      githubUrl: "https://github.com",
      verifiedStatus: "Repository Linked"
    }
  ]
};

export default function SkillPassportView() {
  const { user, profile: authProfile } = useAuth();
  const { isDemo, student } = useDemo();
  const [profile, setProfile] = useState<PassportProfile>(defaultProfile);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(false);

  // Sync session student name dynamically if available
  useEffect(() => {
    const activeName = authProfile?.full_name || (isDemo ? student.name : null) || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : null);
    if (activeName) {
      setProfile(prev => ({ ...prev, name: activeName }));
    }
  }, [authProfile, isDemo, student, user]);

  useEffect(() => {
    async function loadPassport() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('sb-token') : null;
        let res = await fetch('/api/passport', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        if (!res.ok) {
          res = await fetch('/api/student/passport', {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });
        }

        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          if (data && data.skills && data.skills.length > 0) {
            setProfile(prev => ({
              ...prev,
              ...(data.name ? { name: data.name } : {}),
              ...(data.collegeName ? { collegeName: data.collegeName } : {}),
              ...(data.department ? { department: data.department } : {}),
              ...(data.course ? { course: data.course } : {}),
              ...(data.year ? { year: data.year } : {}),
              ...(data.targetRole ? { targetRole: data.targetRole } : {}),
              ...(data.passportId ? { passportId: data.passportId } : {}),
              ...(typeof data.readinessScore === 'number' ? { readinessScore: data.readinessScore } : {}),
              ...(Array.isArray(data.skills) ? { skills: data.skills } : {}),
              ...(Array.isArray(data.projects) ? { projects: data.projects } : {})
            }));
          }
        }
      } catch (err) {
        console.warn("Backend unseeded or unreachable. Using robust default profile.", err);
      } finally {
        setLoading(false);
      }
    }
    loadPassport();
  }, []);

  const categories = ['All', 'Backend', 'Database', 'Core CS', 'DevOps & Tools', 'Frontend'];
  const filteredSkills = activeCategory === 'All' 
    ? profile.skills 
    : profile.skills.filter(s => s.category === activeCategory);

  const getTierStyle = (tier: SkillItem['verificationLevel']) => {
    switch (tier) {
      case 'Evidence Verified':
        return 'bg-purple-50 text-purple-700 border-purple-200/80 ring-1 ring-purple-400/20';
      case 'Practical Verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-1 ring-emerald-400/20';
      case 'Assessment Verified':
        return 'bg-sky-50 text-sky-700 border-sky-200/80 ring-1 ring-sky-400/20';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200/80 ring-1 ring-amber-400/20';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* 1. ANTI-GRAVITY PASSPORT HERO FRAME */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 backdrop-blur-xl p-6 md:p-8 shadow-[0_15px_35px_-10px_rgba(15,23,42,0.06)]">
        <div className="absolute top-0 right-0 h-64 w-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-64 w-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Passport Identity Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center space-x-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-widest uppercase text-indigo-600">Official Living Credential</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  Verified & Active
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">SkillBridge Passport</h1>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">PASSPORT IDENTIFIER</p>
            <p className="font-mono text-sm font-bold text-slate-700 mt-0.5">{profile.passportId}</p>
          </div>
        </div>

        {/* Identity & Metadata Balanced Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          <div className="lg:col-span-2 space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Student Profile</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profile.name}</h2>
              <p className="text-sm font-semibold text-indigo-600 mt-0.5">
                {profile.course} • {profile.department}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-md p-3.5 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">College / Institution</p>
                <p className="text-xs font-bold text-slate-800 mt-1 truncate" title={profile.collegeName}>
                  {profile.collegeName}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-md p-3.5 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Year</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{profile.year}</p>
              </div>

              <div className="rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-md p-3.5 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Role</p>
                <p className="text-xs font-bold text-slate-800 mt-1 truncate" title={profile.targetRole}>
                  {profile.targetRole}
                </p>
              </div>
            </div>
          </div>

          {/* Readiness Gauge */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Career Readiness</span>
            <div className="my-3 text-center">
              <span className="text-4xl font-black text-slate-900">{profile.readinessScore}%</span>
              <span className="block text-[10px] font-bold tracking-widest uppercase text-emerald-600 mt-0.5">Internship Qualified</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${profile.readinessScore}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">Evaluated against target role benchmarks</p>
          </div>

        </div>

        {/* Verification Progression Track */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs">
          <span className="text-slate-400 font-medium">Verification Hierarchy:</span>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 font-semibold">1. Self-Declared</span>
            <span className="text-slate-300">→</span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 font-semibold">2. Assessment Verified</span>
            <span className="text-slate-300">→</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold">3. Practical Verified</span>
            <span className="text-slate-300">→</span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 font-semibold">4. Evidence Verified</span>
          </div>
        </div>
      </div>

      {/* 2. VERIFIED SKILLS MATRIX */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-900">Verified Technical Competencies</h3>
            <p className="text-xs text-slate-500">Multilevel assessments spanning MCQs, algorithmic challenges, and live tasks</p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeCategory === cat 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map((skill, index) => (
            <div 
              key={index}
              className="p-5 rounded-2xl border border-slate-200/70 bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{skill.category}</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{skill.name}</h4>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getTierStyle(skill.verificationLevel)}`}>
                    {skill.verificationLevel}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Verified Score</span>
                    <span className="font-mono font-bold text-slate-900">{skill.score} / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        skill.score >= 80 ? 'bg-emerald-500' : skill.score >= 70 ? 'bg-indigo-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                <span>Evaluated: {skill.lastEvaluated}</span>
                <span className="font-bold text-indigo-600 cursor-pointer hover:underline">View Evidence →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. VERIFIED PROJECTS & PRACTICAL PROOF */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900">Practical Proof & Project Evidence</h3>
          <p className="text-xs text-slate-500">Production repositories and deployed artifacts verifying applied engineering ability</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.projects.map((proj, idx) => (
            <div 
              key={idx}
              className="p-5 rounded-2xl border border-slate-200/70 bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{proj.title}</h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    {proj.verifiedStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">{proj.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {proj.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4">
                {proj.githubUrl && (
                  <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-700 hover:text-indigo-600 transition">
                    GitHub Code ↗
                  </a>
                )}
                {proj.liveUrl && (
                  <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition">
                    Live Demo ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}