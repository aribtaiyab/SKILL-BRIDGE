/**
 * AI Career Navigator System Instruction & Context Prompts
 */

export const CAREER_NAVIGATOR_SYSTEM_INSTRUCTION = `You are Career Navigator, an expert, personalized AI career advisor inside SkillBridge Connect.
You behave like a knowledgeable, objective mentor who answers the user's ACTUAL question with clarity, depth, and empathy.

CRITICAL ARCHITECTURAL CONSTRAINTS:
1. ANSWER THE USER'S ACTUAL QUESTION:
   - If the user asks "Should I focus on DSA or Web Development?", your recommendation must directly address DSA vs Web Development. NEVER change the subject to "Backend Developer" or "Frontend Developer" unless the user asked about it.
   - If the user asks "Java or Python?", compare Java and Python directly.
   - If the user asks "What should I learn after React?", suggest specific next skills following React.
   - If the user asks "Which career is trending?", address current industry trends honestly.
2. DATA INTEGRITY & SAFETY:
   - SkillBridge backend context (student skills, levels, verification status, career targets, assessment scores) is the absolute source of truth.
   - NEVER invent or alter student skill scores, readiness percentages, or verification status.
   - Self-declared skills MUST NOT be treated as verified skills.
   - NEVER fabricate numerical market statistics or invent fake salary numbers. If live market data is unavailable for the request, state clearly: "Market data unavailable for this request."
   - Market Demand is NOT equal to Student Fit. Clearly distinguish personal skill alignment from general market popularity.
3. TONE & FORMATTING:
   - Use direct, encouraging, practical language suitable for a college student.
   - Avoid buzzwords, corporate jargon, and generic fluff.
   - Return strictly valid JSON adhering to the specified schema. No markdown backticks or commentary outside the JSON object.`

export interface CareerNavigatorUserPromptParams {
  query: string
  intent: string
  extractedSubjects?: { subjectA?: string; subjectB?: string; currentSkill?: string; targetDomain?: string }
  studentName: string
  targetCareer: string
  readinessScore: number
  skills: Array<{
    name: string
    level: number
    verificationStatus: string
    isVerified: boolean
  }>
  skillGaps: Array<{
    skill: string
    currentLevel: number | null
    requiredLevel: number
    gap: number
    priority: string
    status: string
  }>
  completedAssessments?: string[]
}

export function buildCareerNavigatorUserPrompt(params: CareerNavigatorUserPromptParams): string {
  const verifiedSkills = params.skills.filter(s => s.isVerified)
  const selfDeclaredSkills = params.skills.filter(s => !s.isVerified)

  const verifiedList = verifiedSkills.length > 0
    ? verifiedSkills.map(s => `- ${s.name}: ${s.level}/100 [${s.verificationStatus}]`).join('\n')
    : '- No verified skills recorded yet (assessments pending)'

  const selfDeclaredList = selfDeclaredSkills.length > 0
    ? selfDeclaredSkills.map(s => `- ${s.name}: ${s.level}/100 [Self Declared]`).join('\n')
    : '- No self-declared skills'

  const gapsList = params.skillGaps.length > 0
    ? params.skillGaps.map(g => `- ${g.skill}: Required ${g.requiredLevel}, Current ${g.currentLevel ?? 'Unassessed'} (Gap: ${g.gap} pts, Priority: ${g.priority})`).join('\n')
    : '- All target requirements currently satisfied'

  return `STUDENT CONTEXT:
- Name: ${params.studentName}
- Target Career Track: ${params.targetCareer}
- Current Assessed Career Readiness: ${params.readinessScore}% (based strictly on verified assessments)

AUTHENTIC SKILLS LEDGER:
Verified Skills (authoritative):
${verifiedList}

Self-Declared Skills (unverified, for context only):
${selfDeclaredList}

AUTHORITATIVE SKILL GAPS (from Skill Intelligence engine):
${gapsList}

STUDENT QUESTION:
"${params.query}"

Detected Intent: ${params.intent}
${params.extractedSubjects ? `Extracted Entities: ${JSON.stringify(params.extractedSubjects)}` : ''}

Generate a structured Career Navigator response JSON matching the schema with all 10 sections:
1. directAnswer: Clear, immediate recommendation answering the specific question.
2. why: 3-4 bullet points explaining why this is better for this specific student based on their profile.
3. marketOutlook: Objective market perspective (demand, growth, opportunity volume, skill momentum, note if live data is unavailable).
4. currentFit: Analysis of how well the student's current profile aligns.
5. skillsHave: The student's existing skills with accurate verification tiers.
6. skillsMissing: Actual skills the student still lacks for this choice.
7. skillGaps: Concrete gaps from the Skill Intelligence engine.
8. whatToLearn: Practical numbered step-by-step learning sequence.
9. roadmap: Realistic 7-day, 30-day, 60-day, 90-day direction (or null if insufficient context).
10. finalRecommendation: Clear concluding guidance.`
}
