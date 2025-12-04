# Intelligent Incident Parser

A lightweight web application that converts unstructured incident reports into structured JSON using the Groq API. Built with **Python FastAPI** backend and **Next.js** frontend.

## Overview

This application takes messy, unstructured incident reports (like panic-stricken emails from servers) and instantly converts them into structured database entries with the following fields:

- **Severity**: High/Med/Low
- **Component**: System component name
- **Timestamp**: ISO format timestamp
- **Suspected_Cause**: Brief cause description
- **Impact_Count**: Number of affected users

## Quick Start

### Prerequisites

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
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
