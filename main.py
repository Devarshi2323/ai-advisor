from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
import os
from dotenv import load_dotenv
import boto3
import uuid
from datetime import datetime

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

def save_report_to_s3(report: str, problem: str) -> str:
    try:
        report_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"report-{timestamp}-{report_id}.txt"
        
        content = f"Business Problem:\n{problem}\n\n{'='*50}\n\nReport:\n{report}"
        
        s3_client.put_object(
            Bucket=os.getenv("AWS_BUCKET_NAME"),
            Key=filename,
            Body=content.encode('utf-8'),
            ContentType='text/plain'
        )
        
        return filename
    except Exception as e:
        print(f"S3 upload error: {e}")
        return None

class BusinessProblem(BaseModel):
    problem: str

class ChatMessage(BaseModel):
    message: str
    report_context: str

def run_agent(role: str, instructions: str, input_text: str, max_tokens: int = 1024) -> str:
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=max_tokens,
        messages=[
            {"role": "user", "content": f"{instructions}\n\nInput: {input_text}"}
        ]
    )
    return message.content[0].text

@app.post("/analyze")
async def analyze(business: BusinessProblem):

    # Agent 1 - Orchestrator
    orchestrator_output = run_agent(
        "Orchestrator",
        "You are a business analyst. List exactly 3 key problems from this business situation. Be very brief, max 3 sentences total.",
        business.problem,
        max_tokens=300
    )

    # Agent 2 - Analyst
    analyst_output = run_agent(
        "Analyst",
        "You are a business analyst. For each problem listed, give one solution in one sentence each. Max 3 sentences total.",
        orchestrator_output,
        max_tokens=300
    )

    # Agent 3 - Report Writer
    report_output = run_agent(
        "Report Writer",
        f"You are a professional report writer. Write a clear modernization roadmap with 3 phases based on this analysis. Use today's date which is {__import__('datetime').date.today().strftime('%B %d, %Y')}. Include tables and expected outcomes.",
        analyst_output,
        max_tokens=4096
    )

    # Agent 4 - Critic
    final_output = run_agent(
        "Critic",
        "You are a quality reviewer. Improve this report's clarity and professionalism. Return the final polished version only, no commentary.",
        report_output,
        max_tokens=4096
    )

    # Save report to AWS S3
    s3_filename = save_report_to_s3(final_output, business.problem)

    return {
        "orchestrator": orchestrator_output,
        "analyst": analyst_output,
        "report": report_output,
        "final": final_output,
        "s3_file": s3_filename
    }

@app.post("/chat")
async def chat(chat_input: ChatMessage):
    response = run_agent(
        "Consultant",
        f"You are an expert business consultant. The following modernization report was generated for a client:\n\n{chat_input.report_context}\n\nAnswer the user's follow-up question based on this report. Be specific, helpful and concise.",
        chat_input.message,
        max_tokens=1024
    )
    return {"response": response}

@app.get("/")
async def root():
    return {"message": "AI Advisor API is running"}