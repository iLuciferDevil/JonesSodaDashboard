# AI Executive Brief Setup

The dashboard is already wired to `/api/ai-summary`.

## Current behavior

- With no model API key configured, the Generate Executive Brief button still works using a deterministic numerical fallback.
- The fallback never invents missing Google or breakdown data.
- AI results are cached by dashboard-data hash in Vercel Blob, so repeated client clicks do not repeatedly incur model cost.

## OpenAI

Add these Environment Variables to the Vercel project. Do not put secrets in GitHub.

- `AI_PROVIDER=auto`
- `OPENAI_API_KEY=<your OpenAI API key>`
- `OPENAI_MODEL=gpt-6.1-sol` (or another supported model)

Redeploy after adding the variables. The same button will automatically switch from the fallback to OpenAI.

## Anthropic / Claude

If Pillar has an Anthropic API credential, add:

- `AI_PROVIDER=anthropic`
- `ANTHROPIC_API_KEY=<your Anthropic API key>`
- `ANTHROPIC_MODEL=<the Claude model ID enabled for the account>`

The full Claude system prompt is in `CLAUDE_AI_SUMMARY_PROMPT.md`.

## Important

A Claude web subscription or a ChatGPT web subscription is not itself an API credential for a custom Vercel application. Keep API keys server-side in Vercel Environment Variables only.

## Output

The endpoint returns JSON with:
- Headline
- Executive summary
- Numerical callouts
- Watchlist
- Section-level summaries for WoW, MoM, SKU, funnel, demographics, geography, delivery, audience, daypart, Google Search, campaigns, creative and portfolio decision-science views.
