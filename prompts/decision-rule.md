# Decision rule

<!--
  Matches the decision rule (section 8) of the group's Project Evaluation Platform in the Part 2 report,
  with Q3 added to the Fail rule and a 0-3 score kept under each rating for detail.
-->

Rate each of Q1, Q2 and Q3 as **Pass**, **Concern** or **Fail**, as in the group's Project Evaluation Platform, and give a 0 to 3 score under the rating for detail:

| Score | Rating | Meaning |
| --- | --- | --- |
| 3 | Pass | Fully meets the criteria, with evidence. |
| 2 | Concern | Minor gaps that can be fixed with conditions. |
| 1 | Concern | Major gaps: significant work or redesign needed. |
| 0 | Fail | Critical failure. |
| `null` | Unknown | You cannot judge it from the description. |

Also judge whether the project's **risks** are acceptable. They are not acceptable when a risk is high likelihood with high or critical severity and nothing in the project mitigates it.

**Scoring when information is missing.** Score what the project actually involves, not how much the description says. First work out the foreseeable impacts from the project's facts. If a section's concerns genuinely do not arise for this project, or the project handles them, it can score 3: a project is not marked down for not touching an area. If the facts point to a foreseeable impact the description does not address, that is a gap: score 2 with a condition, or `unknown` (score `null`) if you cannot tell whether it is handled, and list it in `missing_information`. Never score a section 0 on silence alone.

**Approvals in progress.** Judge approvals against the project's phase. This covers every required step, not just permits: approvals, registrations, inspections, engineering reviews (such as a pre-start health and safety review), assessments and similar. A required step that has been identified and is planned or applied for at the right stage (for example, applied for during design, reviewed or inspected before first use) counts as met, not as a gap. Note it as a condition to obtain before the relevant step, but do not lower the score for it. Lower the score only when a required step is missing, skipped, late for the phase (for example, planned after the work it is meant to authorize), or not identified at all.

A **critical failure** is any of:

- a credible risk to public safety, life or health that is not addressed (O. Reg. 941, s. 77.2(i) and s. 72(2)(b));
- engineering work done or sealed by someone who is not licensed or not competent (Professional Engineers Act, s. 12; O. Reg. 941, s. 72(2)(e) and (h));
- a clear breach of an applicable law, code or required approval;
- Aboriginal or treaty rights likely affected with no consultation planned (Constitution Act, 1982, s. 35).

Apply the rule in this order:

1. Only if the description is too thin to make any meaningful findings (see "How to work", rule 1), ask for more information instead of giving a verdict. Otherwise always give a verdict, rating what you cannot judge as unknown.
2. If **any** of Q1, Q2 or Q3 is a **Fail** (score 0), or the risks are not acceptable, the verdict is **do not proceed**.
3. If any section is a **Concern** or unknown, the verdict is **proceed with conditions**. List each condition, the section it fixes, and the provision it relies on. If the total score is 4 or less, explain why redesign may be better than conditions.
4. If every section is a **Pass** and the risks are acceptable, the verdict is **proceed**.

Always state the ratings, the scores, the total out of 9 and whether the risks are acceptable when you apply the rule. If a section is unknown, give the total over the scored sections and name the unknown one (for example "6/6 scored, Q3 unknown").
