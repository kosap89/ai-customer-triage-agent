# AI Customer Message Triage Agent

A local-first Node.js tool that classifies customer messages, assigns urgency, drafts a Finnish reply, and flags cases that need human review. Version 1 uses rule-based logic with no API keys, no database, and no external services.

Built as a portfolio project to practice professional automation architecture — with a clear path toward n8n workflows and optional AI upgrades later.

---

## Project overview

This project is an **automation component** for customer support triage. You send it a customer message (via CLI, JSON file, or HTTP API), and it returns a structured result with:

- message category
- urgency level
- Finnish reply draft
- human-review recommendation

**Version 1 is rule-based and local-first.** Everything runs on your machine. No cloud AI, no Gmail, no CRM, and no Google Sheets integration is included yet — but the structure is designed so those can be added later.

**No customer messages are sent automatically.** The agent only produces draft replies and review notes. A human (or a separate, explicit automation step you build later) decides what actually gets sent.

---

## Problem it solves

Small teams and solo operators often receive similar customer messages through different channels. Before replying, someone must usually:

1. Read the message
2. Decide what type of request it is
3. Judge how urgent it is
4. Draft a reply
5. Spot cases that should not be auto-handled

This takes time and is easy to get wrong under pressure. This project automates the **first-pass triage** — not the final customer response — so a human can review faster and more consistently.

---

## How it works

1. **Input** — A customer message arrives via CLI, JSON file, or HTTP POST.
2. **Normalize** — The message is converted into a consistent internal format (`id`, `customerName`, `channel`, `subject`, `body`).
3. **Classify** — Keyword rules assign one of six categories.
4. **Assess urgency** — Rules set urgency to `low`, `normal`, or `high`.
5. **Evaluate risk** — Flags are added for complaints, billing issues, legal terms, and other cases that need review.
6. **Generate reply draft** — A Finnish template reply is created. For appointment requests, the draft asks only for details that appear to be missing.
7. **Output** — A readable summary (CLI) and structured JSON (CLI, file mode, or API).

When used with **n8n**, the workflow sends a **POST request** to the local Node.js API at `http://localhost:3000/triage`. n8n does not run the triage logic itself — it calls this project as a separate service.

---

## Architecture

```
Customer message
       │
       ▼
┌──────────────┐     ┌─────────────────────┐
│ CLI / File   │     │ HTTP API (server.js)│◄── n8n POST /triage
│ (index.js)   │     └──────────┬──────────┘
└──────┬───────┘                │
       │                        │
       └──────────┬─────────────┘
                  ▼
         ┌────────────────┐
         │  triage-agent  │  ← orchestrator
         └────────┬───────┘
                  │
     ┌────────────┼────────────┬──────────────┐
     ▼            ▼            ▼              ▼
 classifier   urgency      risk          reply
 (rules)      assessor    evaluator     generator
                  │
                  ▼
         Structured JSON result
```

The design keeps **integration points separate from business logic**:

| Module | Responsibility |
|--------|----------------|
| `triage-agent.js` | Runs the full pipeline |
| `rule-based-classifier.js` | Category detection (replaceable) |
| `reply-generator.js` | Finnish drafts (replaceable) |
| `server.js` | HTTP wrapper for n8n |
| `index.js` | CLI wrapper for local use |

---

## Main features

| Feature | Description |
|---------|-------------|
| **Message classification** | `appointment_booking`, `pricing_question`, `complaint`, `cancellation`, `general_question`, `urgent_issue` |
| **Urgency scoring** | `low`, `normal`, `high` with a short reason |
| **Finnish reply drafts** | Category-based templates; appointment replies ask only for missing scheduling details |
| **Risk flags** | Highlights complaints, billing topics, low confidence, and high urgency |
| **Human review notes** | Recommends when a person should check before sending |
| **CLI modes** | Interactive, sample messages, inline text, JSON file input |
| **HTTP API** | `GET /health` and `POST /triage` for n8n and scripts |
| **n8n workflow** | Included starter workflow that calls the local API |
| **Zero dependencies** | Node.js built-in modules only |

---

## Safety and human-in-the-loop design

This project is intentionally built for **human-in-the-loop** workflows:

- **Drafts only** — Reply text is a suggestion, not an sent message.
- **Review flags** — Complaints, cancellations, urgent issues, and financial topics are flagged for manual check.
- **No auto-send** — Nothing in v1 connects to email, SMS, or chat outbound APIs.
- **No false confirmations** — Appointment replies do not confirm availability or completed bookings.
- **Transparent rules** — Rule-based classification shows matched keywords, so results can be audited.
- **Stable JSON contract** — Downstream tools (like n8n) receive predictable fields for routing to a human queue.

The expected real-world flow is: **triage → human review → send** (where “send” is a separate step you add later).

---

## Technology stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js 18+ (ES modules) |
| HTTP server | Node.js built-in `http` module |
| Classification | Rule-based keyword matching (v1) |
| Reply generation | Rule-based Finnish templates (v1) |
| Dependencies | None |
| Database | None (v1) |
| External APIs | None (v1) |

---

## Project structure

```
ai-customer-triage-agent/
├── data/
│   ├── sample-messages.json           # Sample messages for CLI testing
│   └── input-message.json             # Example JSON file input
├── n8n/
│   └── customer-message-triage-workflow.json   # Starter n8n workflow
├── src/
│   ├── index.js                       # CLI entry point
│   ├── server.js                      # Local HTTP API
│   ├── config/
│   │   └── categories.js
│   ├── classifiers/
│   │   └── rule-based-classifier.js
│   ├── services/
│   │   ├── triage-agent.js            # Main orchestrator
│   │   ├── urgency-assessor.js
│   │   ├── risk-evaluator.js
│   │   └── reply-generator.js
│   ├── output/
│   │   └── formatter.js
│   ├── lib/
│   │   ├── message-loader.js
│   │   ├── appointment-details.js
│   │   └── errors.js
│   └── cli/
│       └── prompt.js
├── .env.example                       # Template for future integrations
├── package.json
└── README.md
```

---

## Setup instructions

### Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- No `npm install` needed — the project has zero npm dependencies

### Steps

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-customer-triage-agent

# Run interactive CLI
npm start
```

Optional: copy `.env.example` to `.env` if you plan to add integrations later. **Not required for v1.**

---

## CLI usage examples

```bash
# Interactive mode — pick a sample or type a message
npm start

# Triage a built-in sample message
npm start -- --sample 1

# Triage custom text
npm start -- --text "Haluan peruuttaa tilaukseni heti"

# JSON output only (for scripts)
npm start -- --sample 6 --json-only

# Triage from a JSON file
npm start -- --input-file data/input-message.json --json-only

# Show all CLI options
npm start -- --help
```

---

## HTTP API usage

Start the local API server:

```bash
npm run server
```

Base URL: `http://localhost:3000`

### GET /health

Check that the server is running:

```bash
curl http://localhost:3000/health
```

Response:

```json
{ "status": "ok" }
```

### POST /triage

Send a customer message for triage:

```bash
curl -X POST http://localhost:3000/triage \
  -H "Content-Type: application/json" \
  -d "{\"customer_message\": \"Hei, haluaisin varata ajan perjantaille klo 15.\"}"
```

Optional request fields: `id`, `customerName`, `channel`, `subject`.

The API returns the same structured JSON as the CLI. Error responses are also JSON:

```json
{ "error": "Missing required field: customer_message." }
```

---

## n8n workflow setup

This repo includes a starter workflow:

**`n8n/customer-message-triage-workflow.json`**

### How it works

1. **Manual Trigger** — Run the workflow on demand (for testing).
2. **Edit Fields** — Sets a sample `customer_message`.
3. **HTTP Request** — Sends `POST http://localhost:3000/triage` with the message as JSON.

n8n calls the local Node.js API; it does not replace the triage agent.

### Setup steps

1. Start the API server in a terminal:
   ```bash
   npm run server
   ```
2. Open [n8n](https://n8n.io/) (local or cloud instance).
3. Import `n8n/customer-message-triage-workflow.json`.
4. Run the workflow manually to test.
5. Inspect the HTTP Request node output for classification, urgency, risk, and reply draft.

If n8n runs in Docker and cannot reach `localhost:3000` on your host machine, you may need to adjust the URL (for example `http://host.docker.internal:3000` on Docker Desktop). That depends on your n8n setup.

---

## Example input and output

### Input (HTTP POST /triage)

```json
{
  "id": "custom-001",
  "customerName": "Matti Meikäläinen",
  "channel": "web_form",
  "subject": "Ajanvaraus",
  "customer_message": "Haluaisin varata ajan perjantaille klo 15."
}
```

### Output (structured JSON)

```json
{
  "meta": {
    "agent": "ai-customer-triage-agent",
    "version": "1.0.0",
    "processedAt": "2026-07-23T00:00:00.000Z",
    "classifier": "rule-based-v1"
  },
  "input": {
    "id": "custom-001",
    "customerName": "Matti Meikäläinen",
    "channel": "web_form",
    "subject": "Ajanvaraus",
    "body": "Haluaisin varata ajan perjantaille klo 15."
  },
  "classification": {
    "category": "appointment_booking",
    "confidence": 0.93,
    "matchedSignals": ["ajanvaraus", "varata ajan", "haluaisin varata"]
  },
  "urgency": {
    "level": "normal",
    "reason": "Standard sales or scheduling inquiry."
  },
  "risk": {
    "requiresHumanReview": false,
    "note": "Low risk: draft reply may be sent after a quick skim. No escalation flags detected.",
    "flags": []
  },
  "reply": {
    "language": "fi",
    "tone": "friendly",
    "draft": "Hei Matti,\n\nKiitos viestistäsi! ..."
  }
}
```

---

## Current limitations

Version 1 is deliberately simple. Be aware of these limits:

- **Rule-based only** — Classification uses keyword matching, not machine learning or LLMs.
- **Finnish-focused replies** — Reply templates are in Finnish; classification supports some English keywords.
- **No persistence** — Messages and results are not stored in a database.
- **No inbound integrations** — Gmail, web forms, and CRM sync are not implemented.
- **No outbound sending** — Replies are drafts only.
- **Local API only** — The HTTP server binds to `localhost:3000` with no authentication.
- **Single-message processing** — One message per request; no batch or conversation threading.

These are acceptable for a v1 portfolio component and are documented so expectations stay realistic.

---

## Future roadmap

Possible next steps (not yet built):

| Phase | Goal |
|-------|------|
| **v2** | Optional local LLM via Ollama for classification and replies |
| **v3** | Persist triage results (file or database) |
| **v4** | n8n workflow branches — route by category/urgency to review queues |
| **v5** | Inbound triggers (webhook, form, email reader) |
| **v6** | Outbound send step with explicit human approval |

OpenAI, Gemini, Gmail, Google Sheets, and CRM connectors are **planned integration options**, not current features. The `.env.example` file lists placeholders for future work.

---

## What I learned

Building this project helped me practice skills that matter for real automations — not just writing scripts:

- **Separating orchestration from logic** — The triage pipeline, classifier, and reply generator are independent modules, which makes the project easier to test and extend.
- **Designing for integration early** — A stable JSON output contract means n8n, scripts, and future services can all use the same result shape.
- **Human-in-the-loop by default** — Automation works best when it assists people, especially for complaints, billing issues, and urgent cases.
- **Local-first development** — Rule-based v1 runs without API keys or cost, which is a practical way to learn before adding AI or cloud services.
- **Automation architecture** — n8n handles workflow orchestration; Node.js handles business logic. Keeping those roles separate is cleaner than putting everything in one place.

---

## License

MIT
