# AI Customer Message Triage Agent

Local-first customer message triage for support teams and automation builders. Classifies incoming messages, assigns urgency, drafts a Finnish reply, and flags items that need human review — all from the command line, with no API keys or database.

Built as a **portfolio-quality automation component** that can later connect to n8n, Gmail, Google Sheets, Ollama, or a CRM.

## What it does (v1)

| Step | Output |
|------|--------|
| **Classify** | `appointment_booking`, `pricing_question`, `complaint`, `cancellation`, `general_question`, `urgent_issue` |
| **Urgency** | `low`, `normal`, `high` |
| **Reply draft** | Professional Finnish template matched to category |
| **Risk note** | Flags + human-review recommendation |
| **Output** | Readable terminal summary + structured JSON |

Classification is **rule-based** in v1 (keyword matching). The architecture is designed so you can swap in Ollama, OpenAI, Gemini, or an n8n webhook without rewriting the CLI.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- No npm packages required (zero dependencies)
- No API keys, no paid services, no database

## Quick start

```bash
# 1. Open the project folder
cd ai-customer-triage-agent

# 2. Run interactive mode
npm start
```

You will be asked to either pick a sample message or type your own.

## Other ways to run

```bash
# Triage sample message #6 (urgent payment issue)
npm start -- --sample 6

# Triage custom text directly
npm start -- --text "Haluan peruuttaa tilaukseni heti"

# JSON only (useful for scripts / future n8n integration)
npm start -- --sample 3 --json-only

# Help
npm start -- --help
```

## Project structure

```
ai-customer-triage-agent/
├── data/
│   └── sample-messages.json      # 8 sample customer messages
├── src/
│   ├── index.js                  # CLI entry point
│   ├── config/
│   │   └── categories.js         # Category & urgency constants
│   ├── classifiers/
│   │   └── rule-based-classifier.js   # ← swap for AI later
│   ├── services/
│   │   ├── triage-agent.js       # Main orchestrator
│   │   ├── urgency-assessor.js
│   │   ├── risk-evaluator.js
│   │   └── reply-generator.js    # ← swap for LLM replies later
│   ├── output/
│   │   └── formatter.js          # Summary + JSON formatting
│   ├── lib/
│   │   ├── message-loader.js
│   │   └── errors.js
│   └── cli/
│       └── prompt.js
├── .env.example                  # Template for future integrations
├── package.json
└── README.md
```

## Sample output

The agent prints a readable summary and JSON like this:

```json
{
  "meta": { "agent": "ai-customer-triage-agent", "version": "1.0.0", ... },
  "input": { "id": "msg-006", "customerName": "Timo Lehtinen", ... },
  "classification": { "category": "urgent_issue", "confidence": 0.77, ... },
  "urgency": { "level": "high", "reason": "..." },
  "risk": { "requiresHumanReview": true, "note": "...", "flags": [...] },
  "reply": { "language": "fi", "draft": "Hei Timo, ..." }
}
```

## Swapping in AI later

| Module | Replace with |
|--------|--------------|
| `src/classifiers/rule-based-classifier.js` | Ollama / OpenAI / Gemini classifier |
| `src/services/reply-generator.js` | LLM-generated Finnish replies |
| `src/index.js` | HTTP server or n8n webhook trigger |

Keep the return shapes the same — `triage-agent.js` and the JSON output stay unchanged.

## Environment variables (future)

Copy `.env.example` to `.env` when you add integrations. **Not required for v1.**

## License

MIT
