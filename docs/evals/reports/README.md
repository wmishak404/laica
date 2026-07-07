# Eval Reports

This directory holds committed, public-safe eval report artifacts.

Reports here must be aggregate or synthetic/redacted. Do not commit raw production prompts, model responses, screenshots, audio, private traces, user identifiers, auth data, request ids, or provider payloads unless a durable privacy/source decision explicitly allows it.

Reports must distinguish synthetic fixture validation from real-usage sampling. A synthetic fixture pass rate is fixture-corpus health evidence, not product-quality rate, live provider quality, or production defect-rate evidence.

Each report should state:

- report id and surface,
- run type and source class,
- branch/SHA or source run,
- calibration status,
- value claim,
- evidence and observed results,
- sample size or fixture count,
- real-usage sample size when relevant,
- privacy posture and raw artifact handling,
- evidence limits and next actions.
