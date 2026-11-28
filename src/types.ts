export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  provider?: string
  error?: string
  streaming?: boolean
  stopped?: boolean
}

export type Verdict = 'proceed' | 'proceed_with_conditions' | 'do_not_proceed'
export type Rating = 'pass' | 'concern' | 'fail' | 'unknown'
export type Severity = 'critical' | 'major' | 'minor' | 'positive'
export type Level = 'low' | 'medium' | 'high'
export type Addressed = 'yes' | 'partly' | 'no'

export interface Finding {
  issue: string
  /** Register IDs from prompts/citations.json, or full citation text for anything not in the register. */
  citations: string[]
  /** The agent gave no citations field at all, which is not the same as finding no legal basis. */
  citationMissing: boolean
  severity: Severity
  confidence: Level
}

export interface SectionResult {
  score: number | null
  rating: Rating
  summary: string
  findings: Finding[]
}

export interface Assessment {
  project_profile: {
    name: string
    summary: string
    location: string
    disciplines: string[]
    phase: string
    decision_makers: string[]
  }
  stakeholders: { group: string; interest: string; at_the_table: boolean }[]
  /** Empty when no persona summaries were given, as in the Part 2 test cases. */
  persona_concerns: { persona: string; concern: string; addressed: Addressed; covered_by: string }[]
  q1: SectionResult
  q2: SectionResult
  q3: SectionResult
  risks: { risk: string; likelihood: Level; severity: Level | 'critical'; unknowns: string }[]
  ethics: { framework: string; analysis: string; leans: Verdict }[]
  conflicts: { between: string; description: string }[]
  decision_rule_applied: string
  verdict: Verdict
  conditions: string[]
  uncertainties: string[]
  missing_information: string[]
}
