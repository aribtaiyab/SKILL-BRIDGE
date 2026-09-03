# SkillBridge Connect — Intelligence Engine Documentation

## 1. Overview
The **SkillBridge Connect Intelligence Engine** is a deterministic, explainable, and testable system for calculating:
1. **Skill Gaps** between a student's verified skills and target benchmarks.
2. **Career Readiness** weighted by skill importance.
3. **Opportunity-Specific Readiness** evaluated against real job/internship minimum thresholds.
4. **Gap Prioritization** to identify what the student should work on first.
5. **Reassessment & Progress Tracking** maintaining honest score differentials ($+/-$).

---

## 2. Core Mathematical Formulations

### 2.1 Skill Gap Formula
$$\text{gap} = \max(\text{required\_level} - \text{current\_level}, 0)$$
- **Range**: $0 \le \text{gap} \le 100$
- **Interpretation**: If current level exceeds required level, $\text{gap} = 0$ (never negative).

### 2.2 Gap Classification Thresholds
- **Critical**: $\text{gap} \ge 15$ OR ($\text{gap} \ge 10$ and $\text{importance} = \text{"High"}$)
- **Needs Improvement**: $1 \le \text{gap} < 15$
- **Ready**: $\text{gap} = 0$

### 2.3 Priority Scoring Formula
To determine the single highest-impact skill gap to tackle first:
$$\text{priority\_score} = \left(\frac{\text{gap}}{\max(\text{required\_level}, 1)}\right) \times \text{importance\_weight}$$

Where importance weights are:
- $\text{High} = 1.0$
- $\text{Medium} = 0.7$
- $\text{Low} = 0.4$

### 2.4 Skill Readiness (Capped)
$$\text{skill\_readiness} = \min\left(\frac{\text{current\_level}}{\text{required\_level}}, 1.0\right)$$
*Overperforming on one skill (e.g. 95/70) cannot artificially inflate other deficit skills beyond 100% contribution.*

### 2.5 Overall Weighted Career Readiness
$$\text{overall\_readiness} = \left(\frac{\sum (\text{skill\_readiness}_i \times w_i)}{\sum w_i}\right) \times 100$$
Rounded to whole percentage.

### 2.6 Reassessment & Honest Progress
$$\text{improvement} = \text{new\_score} - \text{previous\_score}$$
- If a student scores $81$ after $45$: Improvement is $+36$ points.
- If a student scores $74$ after $81$: Improvement is $-7$ points (transparently communicated without fake positive affirmations).

---

## 3. Verification Hierarchy Quality
1. **Institution Verified** (Level 5) — Verified by accredited university or faculty.
2. **Evidence Verified** (Level 4) — Verified through code repos, certifications, or production artifacts.
3. **Practical Verified** (Level 3) — Completed sandbox or practical coding challenge.
4. **Assessment Verified** (Level 2) — Completed timed knowledge assessment.
5. **Self-Declared** (Level 1) — Initial profile onboarding estimate.

---

## 4. Opportunity-Specific Readiness Foundation
When a student evaluates an opportunity:
1. The engine extracts `opportunity_skills` ($minimum\_level$ + $importance$).
2. Compares student's measured scores against each requirement.
3. Identifies:
   - **Strengths** (Satisfied skills)
   - **Missing / Gap Skills**
   - **Main Blocker** (Largest single deficit)
   - **Match Percentage**
