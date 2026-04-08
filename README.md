# Rob ROI Agentic Sales Dashboard

AI-driven sales pipeline with 9 autonomous agents. No manual data entry — the AI researches, qualifies, drafts offers, and negotiates. Human approves at key decision gates.

## Quick Start

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Visit: http://localhost:3000

## The 9-Step Pipeline

| Step | Stage | Agent | Human Action |
|------|-------|-------|--------------|
| 1 | Lead Qualification | Qualify leads (score, scrape website) | Review score |
| 2 | Demand Analysis | Budget, tools, pain points, sales cycle | See inferred data |
| 3 | **Triage** | AI thesis + PROCEED/KILL | **Approve or Kill** |
| 4 | Offer Draft | Tiered pricing + value proposition | Adjust tiers |
| 5 | Risk Review | Margin/timeline/scope flags | Review risks |
| 6 | Presentation | Slide deck + email draft | One-click send |
| 7 | Negotiation | Sentiment + counter-offers | Accept/suggest |
| 8 | Close | Contract PDF + e-sign | Track signature |
| 9 | **Handover** | Roadmap + project brief | **Push to PM** |

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Database:** Prisma ORM, SQLite (swap to PostgreSQL for prod)
- **Agents:** TypeScript scripts (tsx runner)
- **PDF Generation:** PDFKit

## Key Pages

- `/` — Dashboard with stats + agent activity feed
- `/pipeline` — Full Kanban-style pipeline (11 stages)
- `/triage` — **Decision Queue** — AI thesis + Kill/Proceed buttons
- `/handover/[id]` — Brief review → Push to delivery team

## Agent Scripts

Located in `/scripts/`:
- `leadQualificationAgent.ts` — Scraper + quality scorer
- `demandAnalysisAgent.ts` — Budget/cycle estimator
- `triageAgent.ts` — Thesis generator
- `offerDraftAgent.ts` — Pricing strategy
- `reviewBoardAgent.ts` — Risk flagging
- `handoverAgent.ts` — Roadmap + project brief

## Deploy to Vercel

1. Push to GitHub: `beckxplore/rob-roi-sales-dashboard`
2. Connect repo to Vercel (manual — you said you'll do this)
3. Vercel auto-deploys on push

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
```
