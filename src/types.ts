export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  provider?: string
  error?: string
  streaming?: boolean
}

export type Verdict = 'proceed' | 'proceed_with_conditions' | 'do_not_proceed'
export type Rating = 'pass' | 'conditional' | 'fail' | 'unknown'
export type Severity = 'critical' | 'major' | 'minor' | 'positive'
export type Level = 'low' | 'medium' | 'high'

export interface Finding {
  issue: string
  citation: string
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
