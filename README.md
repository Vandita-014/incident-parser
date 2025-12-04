# Intelligent Incident Parser

A lightweight web application that converts unstructured incident reports into structured JSON using the Groq API. Built with **Python FastAPI** backend and **Next.js** frontend.

## Overview

This application takes messy, unstructured incident reports (like panic-stricken emails from servers) and instantly converts them into structured database entries with the following fields:

- **Severity**: High/Med/Low
- **Component**: System component name
- **Timestamp**: ISO format timestamp
- **Suspected_Cause**: Brief cause description
- **Impact_Count**: Number of affected users

## Architecture

## Quick Start

### Prerequisites

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows CMD:
venv\Scripts\activate.bat
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your Groq API key:
# GROQ_API_KEY=your_actual_api_key_here
```

### Frontend Setup

```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

### Step 4: Run the Application

**Terminal 1 - Backend:**

```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

## How We Handle AI Hallucinations

### Prompt Engineering Strategies

1. **Explicit Instructions**: Clear system prompt with exact requirements
2. **Few-Shot Learning**: Example input/output in the prompt
3. **JSON Mode**: Using Groq's `response_format={"type": "json_object"}` to force structured output
4. **Low Temperature**: Set to 0.2 for more consistent, less creative output
5. **Validation Rules**: Multiple layers of validation:
   - Pydantic models for type checking
   - Field validation (Severity must be High/Med/Low)
   - Data normalization (extract numbers, format timestamps)
   - Fallback values for missing data

### Error Handling

- Input validation (minimum length, required fields)
- JSON parsing with error recovery
- API error handling with user-friendly messages
- Network error handling with retry suggestions
