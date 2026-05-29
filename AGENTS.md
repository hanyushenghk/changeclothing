<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Review Agents

- Risk review expert: use `agents/risk-review-expert.md` when a change touches login, payment, webhook, database, AI service, or environment variables. This agent reviews plans, code, and tests only; it does not write code.
