# Rob ROI Sales Dashboard — Agentic Architecture

## Overview

An autonomous, AI-driven sales pipeline where **agents do the work** and the human **approves decisions**. No manual data entry. No static Kanban. No SaaS bloat.

**Core Philosophy:** The system is a proactive coworker, not a passive tool.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Human Approval Layer                    │
│  (CEO Beck reviews agent recommendations, approves/kills)  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              Agent Orchestrator (Cron/Scheduler)            │
│  Triggers: lead intake → every 15min → stage transition    │
└───────┬────────────┬────────────┬────────────┬─────────────┘
        │            │            │            │
   ┌────▼───┐  ┌────▼───┐  ┌────▼───┐  ┌────▼───┐
   │ Agent 1│  │ Agent 2│  │ Agent 3│  │ Agent N│
   │Qualify │  │Analyze │  │Draft   │  │Review  │
   └────────┘  └────────┘  └────────┘  └────────┘
        │            │            │            │
        └────────────┴────────────┴────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    State Database (Prisma)                  │
│  Leads → Qualification → Analysis → Offer → Contract → Done │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│             Next.js Frontend (React + Tailwind)             │
│  Pipeline view · Stage cards · Agent reasoning · Actions   │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Roles (9 Autonomous Agents)

Each agent is a separate TypeScript script that runs as a background process (via cron, queue worker, or on-demand trigger). They read the database, perform external research, generate content, and update lead state.

### 1. Lead Qualification Agent (`scripts/leadQualificationAgent.ts`)
**Trigger:** New lead row inserted (email, contact form, LinkedIn scrape)
**Actions:**
- Scrape lead's company website
- Fetch LinkedIn profile (via proxy API)
- Search news mentions (Google Custom Search)
- Check company size/revenue (Clearbit/RapidAPI)
- Check if domain is disposable/temporary
**Output:** `LeadQualification` record with:
- `qualityScore` (0–100)
- `confidence` (high/medium/low)
- `reasoning` (bullet list of signals)
- `recommendation` (`PURSUE` / `JUNK` / `REVIEW`)
- `dataPoints` (object with scraped facts)
**Frequency:** Runs within 5 minutes of lead ingestion

### 2. Demand Analysis Agent (`scripts/demandAnalysisAgent.ts`)
**Trigger:** Qualification = `PURSUE`
**Actions:**
- Parse initial email transcript (if provided)
- Search company for tool stack (tech blog, job postings)
- Estimate revenue range (employee count × industry avg)
- Identify pain points from job posts/crunchbase
- Generate "questions to ask" list from gaps
**Output:** `DemandAnalysis` record:
- `estimatedBudget` (low/high/enterprise)
- `decisionMakerLevel` (exec/manager/individual)
- `currentTools` (array — e.g., ["Slack", "Excel", "Zapier"])
- `painPoints` (array)
- `expectedSalesCycle` (weeks estimate)
- `missingDataPoints` (list of questions)
- `demandScore` (0–100)
**Frequency:** Runs 10min after qualification

### 3. Triage Board Agent (`scripts/triageAgent.ts`)
**Trigger:** Demand analysis complete
**Actions:**
- Synthesize qualification + analysis
- Calculate `demandScore` (weighted formula)
- Generate thesis: "Why this lead is worth pursuing" or "Why this likely won't close"
- Compare to historical `demandScore` of won/lost deals
**Output:** `TriageReview` record:
- `demandScore` (0–100)
- `thesis` (2–3 sentence summary)
- `recommendedAction` (`PROCEED` / `KILL`)
- `confidence` (high/medium/low)
**Frequency:** Immediate after analysis

### 4. Offer Draft Agent (`scripts/offerDraftAgent.ts`)
**Trigger:** Triage decision = `PROCEED`
**Actions:**
- Pull demand analysis + historical wins
- Generate pricing strategy (tiered, usage-based, enterprise)
- Draft offer structure (scope, timeline, deliverables)
- Create conceptual outline (value props, differentiators)
- Cite similar deals from CRM for anchoring
**Output:** `OfferDraft` record:
- `pricingModel` (e.g., "tiered_monthly")
- `proposedPrice` (low / mid / high tier)
- `offerTerms` (array of clauses)
- `valueProposition` (paragraph)
- `differentiators` (array vs competitors)
- `nextSteps` (suggested timeline)
**Frequency:** Within 15min of triage approve

### 5. Review Board Agent (`scripts/reviewBoardAgent.ts`)
**Trigger:** Offer draft created
**Actions:**
- Compare proposed price/margin against historical won deals
- Flag if price is below 20th percentile for similar segment
- Check timeline feasibility (based on delivery team capacity)
- Detect scope creep risks
- Assemble risk flag summary
**Output:** `RiskAssessment` record:
- `marginRisk` (boolean)
- `timelineRisk` (boolean)
- `scopeRisk` (boolean)
- `flags` (array of strings)
- `riskScore` (0–100)
- `recommendedAdjustments` (suggested changes)
**Frequency:** Immediate after draft

### 6. Presentation Agent (`scripts/presentationAgent.ts`)
**Trigger:** Risk assessment passed (or human override approved)
**Actions:**
- Compile approved strategy into slide deck (PDF via Puppeteer or HTML → PDF)
- Generate customer-facing deck (8–12 slides)
- Draft outreach email (personalized with lead data)
- Create one-pager summary for internal record
**Output:** `Presentation` record:
- `deckUrl` (S3 or /public/presentations/ path)
- `emailDraft` (full HTML email)
- `deckSlides` (JSON array of slide content)
- `status` (`READY` / `SENT` / `FAILED`)
**Frequency:** After final approval

### 7. Negotiation Agent (`scripts/negotiationAgent.ts`)
**Trigger:** Client replies (email/webhook detected) OR status changes to `NEGOTIATING`
**Actions:**
- Sentiment analysis on client message
- Extract objections (price, timeline, scope, features)
- Look up similar negotiation history
- Propose counter-offer within pre-approved bands
- Generate suggested reply text
**Output:** `Negotiation` record:
- `clientSentiment` (+/- / neutral)
- `objections` (array)
- `suggestedConcession` (e.g., "10% discount if annual")
- `suggestedReply` (email draft)
- `priceChange` (delta)
- `timelineChange` (weeks delta)
**Frequency:** On incoming client message (webhook trigger)

### 8. Contract Agent (`scripts/contractAgent.ts`)
**Trigger:** Deal marked `AGREED` (human or AI detects verbal/written agreement)
**Actions:**
- Generate PDF contract from template (PDFKit)
- Populate with negotiated terms
- Add e-signature placeholder ( stipend.com, docuSign mock)
- Send contract email via SMTP
- Set reminder for follow-up (3 days)
**Output:** `Contract` record:
- `contractUrl` (PDF path or S3)
- `status` (`DRAFT` / `SENT` / `SIGNED`)
- `sentAt` (timestamp)
- `signedAt` (timestamp/null)
- `reminderSet` (boolean)
**Frequency:** Immediate after agreement detected

### 9. Handover Agent (`scripts/handoverAgent.ts`)
**Trigger:** Contract signed (`signedAt` populated)
**Actions:**
- Translate offer + strategy into execution roadmap
- Generate onboarding checklist
- Create project brief for delivery team
- Summarize SLA expectations and kickoff agenda
- Compile all artifacts (deck, email thread, contract, notes)
**Output:** `HandoverBrief` record:
- `roadmapSlug` (unique project ID)
- `onboardingChecklist` (JSON tasks)
- `projectBrief` (markdown)
- `deliveryTeamNotified` (boolean)
- ` artifactsBundle` (ZIP path or folder)
- `status` (`READY_FOR_REVIEW` / `DELIVERED`)
**Frequency:** Within 30min of contract signed

---

## Database Schema (Prisma ORM)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite" // Swap to postgresql for prod
  url      = "file:./dev.db"
}

// ─── Leads ──────────────────────────────────────────────────────────
model Lead {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Basic info
  email         String
  companyName   String
  contactName   String?
  source        String   // "web_form", "linkedin", "referral", "email"
  website       String?
  linkedinUrl   String?
  
  // Metadata
  status        String   @default("NEW") // NEW, QUALIFYING, ANALYZING, TRIAGE, OFFER_DRAFT, REVIEW, PRESENTATION, NEGOTIATING, CLOSED_WON, CLOSED_LOST, HANDOVER
  assignedTo    String?  // agent that last touched
  notes         String?
  
  // Relations
  qualification   LeadQualification?
  demandAnalysis  DemandAnalysis?
  triageReview    TriageReview?
  offerDraft      OfferDraft?
  riskAssessment  RiskAssessment?
  presentation    Presentation?
  negotiations    Negotiation[]
  contract        Contract?
  handoverBrief   HandoverBrief?
  activityLog     ActivityLog[]
}

// ─── Qualification ─────────────────────────────────────────────────
model LeadQualification {
  id              String   @id @default(cuid())
  leadId          String   @unique
  lead            Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  
  qualityScore    Int      // 0–100
  confidence      String   // HIGH, MEDIUM, LOW
  recommendation  String   // PURSUE, JUNK, REVIEW
  reasoning       String   // Markdown bullet list
  scrapedData     String   // JSON blob of website/LinkedIn facts
  checkedAt       DateTime @default(now())
}

// ─── Demand Analysis ───────────────────────────────────────────────
model DemandAnalysis {
  id                   String   @id @default(cuid())
  leadId               String   @unique
  lead                 Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  
  estimatedBudget      String   // "sub_50k", "50k_200k", "200k_1m", "enterprise"
  decisionMakerLevel   String   // "executive", "manager", "individual"
  currentTools         String   // JSON array
  painPoints           String   // JSON array
  expectedSalesCycle   Int      // weeks estimate
  missingDataPoints    String   // JSON array
  demandScore          Int      // 0–100
  analyzedAt           DateTime @default(now())
}

// ─── Triage Review ──────────────────────────────────────────────────
model TriageReview {
  id              String   @id @default(cuid())
  leadId          String   @unique
  lead            Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  
  demandScore     Int
  thesis          String   // 2–3 sentence summary
  recommendedAction String // PROCEED, KILL, REVIEW
  confidence      String   // HIGH, MEDIUM, LOW
  comparedToWon   Int?     // avg demand score of similar won deals
  triagedAt       DateTime @default(now())
}

// ─── Offer Draft ────────────────────────────────────────────────────
model OfferDraft {
  id                  String   @id @default(cuid())
  leadId              String   @unique
  lead                Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  
  pricingModel        String   // "tiered_monthly", "usage_based", "enterprise_license"
  proposedPriceLow    Int?     // annual low tier (USD)
  proposedPriceMid    Int?     // annual mid tier (USD)
  proposedPriceHigh   Int?     // annual enterprise (USD)
  offerTerms          String   // JSON array of legal/t&C clauses
  valueProposition    String   // Markdown paragraph
  differentiators     String   // JSON array
  nextSteps           String   // JSON array
  draftedAt           DateTime @default(now())
  reviewedBy          String?  // human reviewer ID
  reviewedAt          DateTime?
}

// ─── Risk Assessment ────────────────────────────────────────────────
model RiskAssessment {
  id                  String   @id @default(cuid())
  leadId              String   @unique
  lead                Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  
  marginRisk          Boolean  @default(false)
  timelineRisk        Boolean  @default(false)
  scopeRisk           Boolean  @default(false)
  flags               String   // JSON array of risk strings
  riskScore           Int      // 0–100
  recommendedAdjustments String? // JSON suggestions
  assessedAt          DateTime @default(now())
}

// ─── Presentation ───────────────────────────────────────────────────
model Presentation {
  id              String   @id @default(cuid())
  leadId          String   @unique
  lead            Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  
  deckUrl         String   // /presentations/leadId.pdf
  emailDraft      String   // HTML email body
  deckSlides      String   // JSON [{title, content, image?}]
  status          String   @default("READY") // READY, SENT, FAILED
  sentAt          DateTime?
  sentBy          String?
}

// ─── Negotiation ────────────────────────────────────────────────────
model Negotiation {
  id              String   @id @default(cuid())
  leadId          String
  lead            Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  
  threadId        String?  // email thread or Slack thread ID
  clientMessage   String   // latest client reply
  sentiment       String   // "positive", "neutral", "negative"
  objections      String   // JSON array
  suggestedConcession String?
  suggestedReply  String   // draft reply text
  priceChange     Int?     // delta from original (signed int)
  timelineChange  Int?     // weeks delta (+ or -)
  createdAt       DateTime @default(now())
  resolved        Boolean  @default(false)
}

// ─── Contract ───────────────────────────────────────────────────────
model Contract {
  id              String   @id @default(cuid())
  leadId          String   @unique
  lead            Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  
  contractUrl     String   // PDF URL
  status          String   @default("DRAFT") // DRAFT, SENT, SIGNED, REJECTED
  termsSnapshot   String   // JSON of final agreed terms
  sentAt          DateTime?
  signedAt        DateTime?
  reminderSet     Boolean  @default(false)
  notes           String?
}

// ─── Handover Brief ─────────────────────────────────────────────────
model HandoverBrief {
  id                  String   @id @default(cuid())
  leadId              String   @unique
  lead                Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  
  roadmapSlug         String   @unique
  onboardingChecklist String  // JSON task array
  projectBrief        String   // Markdown
  artifactsBundlePath String?
  deliveryTeamNotified Boolean @default(false)
  status              String  @default("READY_FOR_REVIEW") // READY_FOR_REVIEW, DELIVERED, ACKNOWLEDGED
  createdBy           String?  // agent or human
  createdAt           DateTime @default(now())
}

// ─── Activity Log (audit trail) ─────────────────────────────────────
model ActivityLog {
  id          String   @id @default(cuid())
  leadId      String
  agent       String   // agent name that performed action
  action      String   // e.g., "QUALIFIED", "DRAFTED_OFFER", "FLAGGED_RISK"
  description String?  // free-form detail
  metadata    String?  // JSON blob (before/after snapshots)
  createdAt   DateTime @default(now())
}
```

---

## Frontend Component Structure

```
src/
├── app/
│   ├── layout.tsx        (RootLayout with ThemeProvider)
│   ├── page.tsx          (Dashboard overview / pipeline snapshot)
│   ├── leads/            (Lead list + detail routes)
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── pipeline/         (Full-screen pipeline canvas)
│   │   └── page.tsx
│   ├── triage/           (Decision queue view)
│   │   └── page.tsx
│   ├── negotiation/      (Chat-style negotiation UI)
│   │   └── [id]/page.tsx
│   ├── handover/         (Final review + push to PM system)
│   │   └── [id]/page.tsx
│   └── api/              (Next.js API routes)
│       ├── webhooks/     (Email reply detection, contract signed)
│       │   └── route.ts
│       └── agents/       (Manual agent triggers)
│           └── route.ts
├── components/
│   ├── pipeline/
│   │   ├── PipelineBoard.tsx       (Stage columns, drops)
│   │   ├── LeadCard.tsx            (Compact card with AI badges)
│   │   ├── AgentBadge.tsx          (Which agent touched it)
│   │   ├── DemandScoreGauge.tsx    (0–100 gauge chart)
│   │   └── StageGate.tsx           (Human approval button)
│   ├── agents/
│   │   ├── AgentActivityFeed.tsx   (Live feed of what agents are doing)
│   │   ├── AgentReasoningPanel.tsx (Chain-of-thought display)
│   │   └── AgentActionButton.tsx   (Force-run an agent manually)
│   ├── leads/
│   │   ├── LeadQualificationPanel.tsx  (Step 1 output)
│   │   ├── DemandAnalysisPanel.tsx     (Step 2 output)
│   │   ├── TriageDecisionCard.tsx      (Step 3 card)
│   │   ├── OfferDraftCanvas.tsx        (Step 4 canvas)
│   │   ├── RiskAssessmentPanel.tsx     (Step 5 flags)
│   │   ├── PresentationPreview.tsx     (Step 6 deck)
│   │   ├── NegotiationChat.tsx         (Step 7 chat interface)
│   │   ├── ContractTracker.tsx         (Step 8 signature status)
│   │   └── HandoverBriefReview.tsx     (Step 9 brief review)
│   ├── shared/
│   │   ├── DataPointMissing.tsx    (Highlighted missing info)
│   │   ├── ConfidenceBadge.tsx     (HIGH/MED/LOW color badge)
│   │   ├── SentimentIndicator.tsx  (+/- face/sentiment)
│   │   └── RiskFlagPill.tsx        (Red/amber warning pill)
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── MarkdownRenderer.tsx
│       └── GaugeChart.tsx
├── lib/
│   ├── db.ts              (Prisma singleton)
│   ├── agents/            (Agent orchestrator utils)
│   │   ├── runner.ts      (Spawn agent script, capture output)
│   │   ├── queue.ts       (Job queue for background agents)
│   │   └── scheduler.ts   (Cron triggers based on lead.status)
│   ├── scoring/
│   │   └── demandScoreCalculator.ts  // Formula: qualScore×0.3 + budget×0.3 + companySize×0.2 + toolFit×0.2
│   ├── integrations/
│   │   ├── linkedin.ts    (LinkedIn profile scraper)
│   │   ├── clearbit.ts    (Company enrichment)
│   │   ├── email.ts       (SendGrid/Nodemailer)
│   │   └── supabase.ts    (Optional: webhook receiver)
│   └── utils/
│       └── pdfGenerator.ts (Deck → PDF)
└── types/
    └── index.ts           (All TypeScript interfaces from Prisma)
```

---

## Agentic UI Patterns

### Pattern 1: Agent Feed
```
[10:42 AM] Qualification Agent → "Checked https://acme.com. Found 50–100 employees. Suggestion: PURSUE"
[10:42 AM] Demand Agent    → "Analyzing job posts... identified pain point: manual data entry."
[10:43 AM] Triage Agent    → "Demand score 78/100. Thesis: Mid-market company with budget. PROCEED."
```
UI: Collapsible side panel with timestamped agent actions. Each entry has:
- Agent icon/name
- Action type
- Summary text
- Expandable reasoning (markdown)

### Pattern 2: Decision Queue (Not a Kanban)
Instead of dragging cards, user sees a **queue of decisions**:

```
┌─ REVIEW QUEUE (3 pending) ──────────────────────────────┐
│                                                         │
│  [Card] Acme Corp (demand: 78)                         │
│  AI Thesis: "Mid-market, 50–100 employees, pain point │
│  evident from job posts. Good fit for Rob ROI."        │
│                                                         │
│  Actions: [KILL DEAL]      [PROCEED TO OFFER]          │
│                                                         │
│  [Card] Beta Ltd (demand: 32)                          │
│  AI Thesis: "Tiny team, likely no budget. Low fit."    │
│                                                         │
│  Actions: [KILL DEAL]      [PROCEED ANYWAY]            │
│                                                         │
│  [Card] Gamma Inc (demand: 91)                         │
│  AI Thesis: "Enterprise with clear automation needs.  │
│   Strong signal from website scraping."                 │
│                                                         │
│  Actions: [KILL DEAL]      [PROCEED TO OFFER]          │
└─────────────────────────────────────────────────────────┘
```

### Pattern 3: Collaborative Canvas (Offer Draft)
```
Left panel: AI-generated offer (editable rich text)
Right panel: Human tweaks (sliders for price tiers, picklist for timeline)
Bottom: "Regenerate" button — AI re-drafts based on new constraints
```

### Pattern 4: Risk Highlighter
The Review Board agent flags risk items directly in the offer preview:
- 🔴 Margin below threshold
- 🟡 Timeline too tight
- 🔴 Scope creep potential

Each flag has: "Explain" tooltip → "Adjust" button → auto-regenerate.

### Pattern 5: Negotiation Side-by-Side
```
┌─ OFFER (static, on left) ─────────────────┐
│  • Tier 1: $12k/year                    │
│  • Tier 2: $24k/year                    │
│  • Tier 3: $48k/year                    │
│                                         │
│  Includes: onboarding, 24/7 support      │
└─────────────────────────────────────────┘
         │
         ▼  (AI suggestion)
┌─ CLIENT REPLY: "Too expensive" ──────────┐
│                                         │
│  AI Analysis:                           │
│  • Sentiment: negative                  │
│  • Objection: price                     │
│  • Historical pattern: 30% discount with │
│    annual commitment closed similar deal│
│                                         │
│  Suggested Counter:                     │
│  "We can offer 20% off for annual"      │
│                                         │
│  [Send as-is]  [Edit]  [Reject]         │
└─────────────────────────────────────────┘
```

### Pattern 6: Handover Brief Review
Final step: Human gets a **single consolidated document** they can:
- Read through (markdown render)
- Edit inline (contenteditable with save)
- Add notes/comments
- Push one button: "Send to PM System" (creates GitHub issue, Linear ticket, or sends email)

---

## Agent Orchestration

### Trigger Types
1. **Time-based:** Cron every 15min scans DB for leads in status `X` that need agent `Y`
2. **Event-based:** Webhook from email (new reply), or status change → trigger relevant agent
3. **Manual:** Human clicks "Run Analyst Agent" button → explicit trigger

### Agent Execution Model
```typescript
interface AgentRun {
  agentName: string;
  leadId: string;
  trigger: "cron" | "event" | "manual";
  context: Record<string, any>; // past state
  invoke(): Promise<AgentResult>;
}

type AgentResult = {
  success: boolean;
  newState: Partial<Lead>;
  sideEffects: Array<{
    type: "LOG" | "EMAIL" | "CREATE_FILE";
    payload: any;
  }>;
};
```

---

## Key Technical Decisions

| Decision | Choice | Why |
|----------|-------|-----|
| Backend framework | Next.js 14+ App Router | React Server Components for SSR, API routes built-in |
| Database ORM | Prisma | Type-safe queries, easy migrations, SQLite → Postgres path |
| UI library | Tailwind + Radix UI | No design overhead, fully customizable |
| State management | Zustand | Simple client-side store for lead detail views |
| PDF generation | pdfkit (server-side) | No browser dependency, easy templates |
| Email | Nodemailer (SMTP) or Resend | Transactional, reliable |
| Hosting | Vercel (frontend) + Railway/Render (workers) | Separate concerns, scale independently |
| Agent runtime | Separate Node processes (tsx) | Failures isolated, can run on different machines |

---

## What Makes This "Agentic" (Not SaaS)

1. **No "New Lead" button.** Lead appears → agent runs autonomously.
2. **No "Save" buttons.** Drafts auto-save to DB. Edits are live.
3. **No "Next Stage" dropdown.** Stage advances when AI + human combo decides.
4. **No "Fill form."** Human tweaks variables; AI rewrites content.
5. **No "Export PDF."** Generated automatically at the right moment.
6. **No "CRM import."** Agents do the research themselves.

**The human's job:** Approve. Decline. Tweak. Sign off.

**The agent's job:** Do the legwork, draft, synthesize, recommend.

---

## API Endpoints (Next.js Route Handlers)

```
GET    /api/leads                     → list all leads (pagination)
GET    /api/leads/:id                 → full lead detail + all artifacts
POST   /api/leads                     → create lead (webhook intake)
PATCH  /api/leads/:id/status          → move to next stage (human action)
POST   /api/agents/trigger            → {leadId, agentName} manual run
GET    /api/agents/activity           → recent agent feed (SSE or polling)
POST   /api/webhooks/email-reply      → inbound email webhook → kickoff Negotiation Agent
POST   /api/webhooks/contract-signed  → e-signature provider callback → kickoff Handover Agent
GET    /api/presentations/:id/pdf     → stream PDF
POST   /api/handover/:id/deliver      → push brief to PM system (Linear/GitHub)
```

---

## Cron Schedule (Running the Agents)

```
*/15 * * * *   node scripts/agentScheduler.ts     // Scan DB, run due agents
0 8 * * *      node scripts/dailyDigest.ts        // Morning summary for CEO
0 20 * * *     node scripts/eveningReport.ts      // EOD pipeline health
```

---

## Environment Variables

```env
DATABASE_URL="file:./dev.db"          # or postgresql://...
OPENAI_API_KEY="sk-..."
RESEND_API_KEY="re_..."
S3_BUCKET="rob-roi-presentations"
GITHUB_TOKEN="ghp_..."                # for Linear/GitHub integration
LINEAR_API_KEY="lin_..."
EMAIL_SMTP_HOST="smtp.gmail.com"
EMAIL_SMTP_USER="..."
EMAIL_SMTP_PASS="..."
```

---

## First Run Setup

```bash
cd rob-roi-sales-dashboard
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Visit: http://localhost:3000

---

## How It Feels

The UI looks like a sleek dark-mode dashboard. But it's **alive**:

- Cards move between stages automatically when an agent completes work
- "Thinking..." spinners appear while the AI researches
- Agent reasoning is visible (not hidden)
- Human sees **options**, not empty forms
- Every action is justified by the AI, every decision is evidence-based

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Lead → Qualified time | < 1 hour |
| Qualified → Offer draft time | < 4 hours |
| Offer → Presentation time | < 1 hour |
| Human approval latency | < 24 hours (avg) |
| % of leads auto-killed by AI | ~40% (saving human time) |
| Deal win rate (quality leads) | > 25% |

---

Repo: https://github.com/beckxplore/rob-roi-sales-dashboard
