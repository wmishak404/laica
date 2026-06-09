# 2026-06-09 - Arize Open-Coding Intake

**Intake id:** `arize-open-coding-2025-11-07`
**Source:** Arize open-coding notes
**Owner / reviewer:** Wilson labels; Codex summary
**Raw artifact handling:** Raw prompt/table provided in chat; not committed
**Privacy posture:** Summarized field names, cluster evidence, and recipe titles only
**Related surfaces:** Legacy pantry-first recipe suggestions
**Prompt/model/evaluator versions:** Historical pantry-first Markdown prompt; model/evaluator version not provided in chat
**Input schema:** `Pantry_Ingredients`, `Cuisine_Preferences`, `Proficiency`, `Max_Cook_Time`, `Dietary_Restrictions`, `Nutritional_Preferences`, `Kitchen_Equipment`
**Sample size:** 18 notes across 16 unique examples
**Positive definition:** Wilson note of "No issues" or equivalent positive review; criterion-level labels still need normalization
**Trend tags:** `food-safety`, `proficiency-fit`, `equipment-fit`, `max-time`, `cuisine-pantry-tradeoff`, `structure-contract`

## Source Summary

Historical open-coding review of a pantry-first Markdown prompt. The prompt asked for recipe fields including `name`, `description`, `difficulty`, `cookTime`, `pantryIngredientsUsed`, `additionalIngredientsNeeded`, `overview`, `instructions`, and `isFusion`. It differs from the current app because current route contracts often require structured JSON, so use this intake for failure taxonomy and positive-example discovery, then revalidate against current response contracts.

## Metrics Summary

| Metric | Value | Calibration status | Notes |
|---|---|---|---|
| Observed positive-note rate | 9/18 notes, 50.0% | Human open-coding signal, not item-normalized | Multiple notes can attach to one example; do not treat as item-level pass rate |
| Unique examples with notes | 16 | Human open-coding signal | Phase 2 should normalize to example-level criterion labels |
| Human label pass rate | n/a | Requires criterion-level normalization | "No issues" notes are useful positives but not yet a rubric-complete label set |
| TPR | n/a | No automated judge evaluated this intake | Future LLM judges should be calibrated against normalized Wilson labels |
| TNR | n/a | No automated judge evaluated this intake | Negative clusters are useful candidates for specificity testing |
| Corrected pass rate | n/a | Requires judge observations plus TPR/TNR | Do not report until judge + human labels exist |
| Confidence interval | n/a | Not computed | Add only after item-level labels and sufficient sample size |

## Failure / Learning Clusters

| Cluster | Evidence | Criterion family | Proposed deterministic check | Proposed judge or human label | Product / prompt implication |
|---|---|---|---|---|---|
| Food safety and doneness | Beef instructions said "heated through" rather than cooked until safe; chicken instructions relied on time/medium heat rather than checking doneness; beginner chicken prep needed more raw-handling guidance | Food safety / cooking steps | Flag raw meat/poultry/egg recipes for required doneness and handling cues | Human label: pass only when safety cues fit ingredient risk and user proficiency | Prompt should require explicit safety cues for raw proteins, especially for beginners |
| Technique quality by proficiency | Intermediate chicken recipe should warn against overcooking breast; beginner Vietnamese fried rice steps may be too complex | Cooking steps / skill fit | Check returned difficulty and step count/complexity against user proficiency where practical | Human label: steps are appropriate for the stated proficiency | Prompt should adapt detail and technique nuance to proficiency |
| Equipment availability | Recipe referenced a saucepan lid even though equipment did not list one; reviewer suggested a plate or similar cover alternative | Equipment fit / cooking steps | Detect unlisted equipment terms or require safe common alternatives | Human label: all required equipment is listed or a safe alternative is provided | Steps must not assume missing tools without fallback |
| Max cook time | One vegan Vietnamese/Mexican example returned 30 minutes when user max was 25 minutes | User constraints | Compare returned `cookTime` against user max | Human label: fail outputs over max unless product explicitly accepts a rounding exception | Prompt and formatter should round without violating max-time constraints |
| Cuisine and pantry tradeoff | Korean/Japanese preference used olive oil because only olive oil was in pantry; reviewer noted sesame oil would be more typical but accepted pantry-first beginner constraint | Cuisine fit / pantry grounding | n/a for authenticity; deterministic checks can detect missing selected-cuisine anchors | Human label should distinguish acceptable pantry-first adaptation from cuisine mismatch | Prompt should be honest about adaptation and avoid unnecessary shopping-list correction |
| Output structure/extraction | Some recipe-title extraction appeared as ```markdown because the historical prompt asked Markdown | Structure and contract | Current harness should parse/validate JSON, not scrape Markdown | Human label: fail if current UI cannot parse/render output | Move current evals away from Markdown extraction |

## Positive Examples Worth Preserving

| Example | Why it passed | Regression risk if over-corrected |
|---|---|---|
| Mediterranean smoked salmon bagel under limited ingredients | Reviewer said limited ingredients made the good suggestion reasonable | Over-correcting could reject practical simple dishes for lacking elaborate cuisine markers |
| Vegan Vietnamese-inspired chickpea stir-fry | Reviewer recorded no issues under vegan/fiber-rich constraints | Prompt changes should preserve dietary fit while improving safety/structure checks |
| Ethiopian-inspired chickpea stew and lentil stew examples | Reviewer recorded no issues across multi-cuisine, vegan/vegetarian, high-fiber/high-protein contexts | Cuisine-fit tuning should not remove useful inspired dishes when pantry evidence supports them |

## Fixture Candidates

| Candidate | Source id / description | Intended criterion | Raw-data handling |
|---|---|---|---|
| Korean beef stir-fry safety/adaptation | Beginner Japanese/Korean protein-heavy example using olive oil and weak beef doneness language | Food safety; cuisine/pantry adaptation | Summarize or synthesize fixture from notes |
| Chicken Parmesan with zoodles | Intermediate Italian/French keto example needing chicken doneness and overcooking guidance | Food safety; technique fit | Summarize or synthesize fixture from notes |
| Vietnamese coconut rice equipment issue | Beginner Mexican/Vietnamese Halal/no-spicy example requiring a lid not listed | Equipment fit | Summarize or synthesize fixture from notes |
| Vegan Vietnamese/Mexican cook-time miss | Max 25 minutes but output took 30 | Max-time adherence | Summarize or synthesize fixture from notes |
| Beginner Vietnamese fried rice complexity | Beginner example flagged as too complicated | Proficiency fit | Summarize or synthesize fixture from notes |

## Open Questions / Deferrals

- Phase 2 must normalize note-level observations into example-level criterion labels.
- Future judge prompts should be tested against these clusters after deterministic checks handle schema/time/equipment where possible.
- The product needs a clear rule for pantry-first authenticity: when an adaptation is acceptable, when to suggest optional cuisine anchors, and when to explain a pantry-constrained fallback.
