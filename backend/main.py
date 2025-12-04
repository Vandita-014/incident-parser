from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal, Union, Optional
from dotenv import load_dotenv
import os
import json
from groq import Groq
from datetime import datetime
import re
import uvicorn

load_dotenv()

app = FastAPI(
    title="Intelligent Incident Parser API",
    description="Convert unstructured incident reports to structured JSON using Groq API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError(
        "GROQ_API_KEY environment variable is not set. Please create a .env file with your Groq API key.")

groq_client = Groq(api_key=groq_api_key)


class IncidentInput(BaseModel):
    text: str = Field(...,
                      description="Unstructured incident report text", min_length=10)


class ParsedIncident(BaseModel):
    Severity: Literal["High", "Med", "Low"]
    Component: str
    Timestamp: str
    Suspected_Cause: str
    Impact_Count: int


class ParseResponse(BaseModel):
    success: bool
    data: Optional[ParsedIncident] = None
    error: Optional[str] = None


def extract_timestamp(text: str) -> str:
    """Extract time from text in HH:MM:SS format"""
    now = datetime.now()
    default_time = now.strftime("%H:%M:%S")

    pm_pattern = r'(\d{1,2}):(\d{2})\s*(PM|pm)'
    am_pattern = r'(\d{1,2}):(\d{2})\s*(AM|am)'
    time_pattern = r'(\d{1,2}):(\d{2})'

    pm_match = re.search(pm_pattern, text, re.IGNORECASE)
    if pm_match:
        hour = int(pm_match.group(1))
        minute = pm_match.group(2)
        if hour != 12:
            hour = (hour + 12) % 24
        return f"{hour:02d}:{minute}:00"

    am_match = re.search(am_pattern, text, re.IGNORECASE)
    if am_match:
        hour = int(am_match.group(1))
        minute = am_match.group(2)
        if hour == 12:
            hour = 0
        return f"{hour:02d}:{minute}:00"

    time_match = re.search(time_pattern, text)
    if time_match:
        hour = int(time_match.group(1))
        minute = time_match.group(2)
        return f"{hour:02d}:{minute}:00"

    return default_time


def create_parsing_prompt(incident_text: str) -> tuple:
    """
    Create a well-engineered prompt for Groq API to prevent hallucinations.

    Strategy:
    1. Clear system instructions with examples
    2. Explicit JSON schema requirements
    3. Validation rules to prevent made-up data
    4. Few-shot learning with example
    """

    system_prompt = """You are an expert incident parser. Your job is to extract structured information from unstructured incident reports.

CRITICAL RULES - Follow these exactly:
1. Extract ONLY information that is explicitly mentioned or can be reasonably inferred from the text
2. DO NOT invent or guess information that isn't in the text
3. Return ONLY valid JSON, no markdown formatting, no explanations
4. If a field cannot be determined, use reasonable defaults based on context

REQUIRED FIELDS:
- Severity: Must be exactly "High", "Med", or "Low"
  * High: Critical systems down, many users affected, production outages
  * Med: Partial functionality, some users affected, degraded performance
  * Low: Minor issues, few users, non-critical systems
  
- Component: The specific system/service/component mentioned (e.g., "Database US-East-1", "Load Balancer")
  * Extract the exact component name from the text
  * If multiple components, list the primary one
  
- Timestamp: Time ONLY in HH:MM:SS format (NO DATE)
  * Extract time from text if mentioned (e.g., "6:30 PM" becomes "18:30:00")
  * Return ONLY time, never include date
  * Format: "18:30:00" (NOT "2024-01-15T18:30:00")
  
- Suspected_Cause: Brief description of what likely caused the issue
  * Extract from text (e.g., "migration script", "deployment", "network issue")
  * Be specific but concise
  
- Impact_Count: Number of users/systems affected
  * Extract the number mentioned in text
  * If not mentioned, use 0
  * Must be an integer

EXAMPLE:
Input: "Hey team, the production database US-East-1 just timed out at 6:30 PM. I think it's the migration script deployed by Sarah. Error code 503 showing up on the load balancer. 500 users affected."

Output:
{
  "Severity": "High",
  "Component": "Database US-East-1",
  "Timestamp": "18:30:00",
  "Suspected_Cause": "Migration script deployed by Sarah",
  "Impact_Count": 500
}

Remember: Only extract what's in the text. Don't make up details."""

    user_prompt = f"""Parse this incident report and extract structured data. Return ONLY the JSON object with no additional text:

{incident_text}"""

    return system_prompt, user_prompt


def parse_groq_response(response_text: str) -> dict:
    """Parse and validate Groq API response, handling edge cases"""
    try:
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        data = json.loads(response_text)

        required_fields = ["Severity", "Component",
                           "Timestamp", "Suspected_Cause", "Impact_Count"]
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        if data["Severity"] not in ["High", "Med", "Low"]:
            severity_lower = str(data["Severity"]).lower()
            if "high" in severity_lower or "critical" in severity_lower:
                data["Severity"] = "High"
            elif "med" in severity_lower or "medium" in severity_lower:
                data["Severity"] = "Med"
            else:
                data["Severity"] = "Low"

        if isinstance(data["Impact_Count"], str):
            numbers = re.findall(r'\d+', str(data["Impact_Count"]))
            data["Impact_Count"] = int(numbers[0]) if numbers else 0
        else:
            data["Impact_Count"] = int(data["Impact_Count"])

        timestamp = data["Timestamp"]
        if not re.match(r'^\d{2}:\d{2}:\d{2}$', timestamp):
            iso_match = re.match(
                r'\d{4}-\d{2}-\d{2}T(\d{2}:\d{2}:\d{2})', timestamp)
            if iso_match:
                data["Timestamp"] = iso_match.group(1)
            else:
                data["Timestamp"] = extract_timestamp(
                    data.get("Timestamp", ""))

        if not data["Component"] or len(data["Component"].strip()) == 0:
            data["Component"] = "Unknown Component"

        if not data["Suspected_Cause"] or len(data["Suspected_Cause"].strip()) == 0:
            data["Suspected_Cause"] = "Unknown"

        return data

    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON response from AI: {str(e)}")
    except Exception as e:
        raise ValueError(f"Error parsing AI response: {str(e)}")


@app.get("/")
async def root():
    return {
        "message": "Intelligent Incident Parser API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "groq_configured": groq_api_key is not None}


@app.post("/api/parse-incident", response_model=ParseResponse)
async def parse_incident(incident: IncidentInput):
    """
    Parse unstructured incident report into structured JSON

    - **text**: The unstructured incident report text

    Returns structured data with:
    - Severity: High/Med/Low
    - Component: System component name
    - Timestamp: ISO format timestamp
    - Suspected_Cause: Brief cause description
    - Impact_Count: Number of affected users
    """
    try:
        if not incident.text or len(incident.text.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Incident text must be at least 10 characters long"
            )

        system_prompt, user_prompt = create_parsing_prompt(incident.text)

        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=500,
                response_format={"type": "json_object"}
            )

            response_text = completion.choices[0].message.content

            if not response_text:
                raise ValueError("Empty response from Groq API")

            parsed_data = parse_groq_response(response_text)
            parsed_incident = ParsedIncident(**parsed_data)

            return ParseResponse(
                success=True,
                data=parsed_incident,
                error=None
            )

        except Exception as api_error:
            error_msg = f"Groq API error: {str(api_error)}"
            return ParseResponse(
                success=False,
                data=None,
                error=error_msg
            )

    except HTTPException:
        raise
    except Exception as e:
        return ParseResponse(
            success=False,
            data=None,
            error=f"Error processing request: {str(e)}"
        )

if __name__ == "__main__":

    uvicorn.run(app, host="0.0.0.0", port=8000)
