# AI Business Advisor

I built this project to show how multi-agent AI can solve real business problems. You describe your business situation, and 4 AI agents work together to give you a full modernization roadmap.

## What it actually does

Type in something like *"I run a trucking company with 15 drivers and everything is manual"* and the system breaks it down, analyzes it, writes a report, and polishes it — automatically.

You can also ask follow-up questions after the report, like a real consultant.

## How the agents work

There are 4 agents running behind the scenes:

- **Orchestrator** — reads your problem and breaks it into key areas
- **Analyst** — digs into each area and finds the real pain points
- **Report Writer** — turns the analysis into a clean structured roadmap
- **Critic** — reviews everything and improves it before you see it

Each one feeds into the next. That's what makes it a multi-agent system.

## Tech I used

- Python + FastAPI for the backend
- Claude API (Anthropic) for the AI agents
- React for the frontend
- AWS S3 to store every report in the cloud
- Deployed on Railway

## Why AWS S3?

Every report gets saved automatically with a unique ID and timestamp. Nothing gets lost, and it scales without any changes to the code.

## Running it locally

Backend:
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm start
```

## Environment variables you'll need
ANTHROPIC_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=ai-advisor-reports
AWS_REGION=us-east-2

## About

Built by Devarshi Patel. This was a personal project to learn multi-agent AI, AWS, and full stack development.
