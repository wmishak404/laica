# Eval Reports

This directory holds committed, public-safe eval report artifacts.

Reports here must be aggregate or synthetic/redacted. Do not commit raw production prompts, model responses, screenshots, audio, private traces, user identifiers, auth data, request ids, or provider payloads unless a durable privacy/source decision explicitly allows it.

Reports must distinguish synthetic fixture validation from real-usage sampling. A synthetic fixture pass rate is fixture-corpus health evidence, not product-quality rate, live provider quality, or production defect-rate evidence.

Mixed reports must keep score-bearing populations separate. Sentinel controls and known-positive/known-negative synthetic controls validate judge/rubric behavior and should report control agreement only. They must not be folded into provider-sample quality rates, human-labeled provider pass rates, or product-readiness claims. If an overall mixed pass rate is shown, mark it diagnostic only.

Human-review exports must include the context needed to judge the artifact under test. For `live_cooking_step_previews`, include the actual step instruction paired with the provider action label and final rendered preview/headline label; a list of preview labels alone is not enough for human calibration. Use recipe or scenario names that describe the case, not names that encode the expected outcome such as "Failure"; expected outcome belongs in source class, score bucket, labels, or judge expectations.

Reports should include an explicit action-routing section when human labels or judge disagreements create follow-up work. Use lanes such as fixture lane, judge criteria lane, report-structure lane, prompt/runtime product lane, and next-calibration lane. Product behavior changes should consume promoted learnings from reports, not every raw row mechanically.

Human confidence affects promotion strength but should not erase signal. `FAIL` / `HIGH` is a strong product-learning candidate. `FAIL` / `MEDIUM` is still a product-learning candidate when the failure mode is clear or repeated. `BORDERLINE` / `HIGH` is strong rubric or product nuance; it may become prompt guidance or a fixture after more evidence or Wilson promotion. `BORDERLINE` / `MEDIUM` remains trend signal and should be aggregated across runs. `PASS` with judge false alarm routes primarily to judge calibration.

Each report should state:

- report id and surface,
- run type and source class,
- score bucket or calibration class when the report mixes controls and provider/generated samples,
- branch/SHA or source run,
- calibration status,
- value claim,
- evidence and observed results,
- sample size or fixture count,
- real-usage sample size when relevant,
- privacy posture and raw artifact handling,
- human-label confidence and product-learning promotion status when human review exists,
- action routing,
- evidence limits and next actions.
