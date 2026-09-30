# DRISHTI — AI-Powered Early Risk Detection for Project Monitoring

**From project data to early warnings — DRISHTI helps identify, explain, and predict infrastructure project risks before they become critical.**

DRISHTI is an AI-powered project monitoring and risk intelligence system designed to help government and enterprise teams identify potential project risks at an early stage. It transforms project data such as **budget utilization, physical progress, timelines, and inspection remarks** into actionable risk insights.

Unlike conventional monitoring dashboards that primarily show project status, DRISHTI focuses on **early detection and prediction**—helping monitoring teams understand **which projects are at risk, why they are at risk, and what may happen if the risk continues**.

### Why DRISHTI?

Infrastructure projects can involve multiple risk factors simultaneously—**budget utilization, slow physical progress, schedule slippage, implementation issues, and critical remarks in inspection reports**. When these signals are examined separately, emerging problems can be difficult to identify early.

DRISHTI brings these signals together into a unified intelligence layer that can:

**Monitor → Detect → Predict → Explain → Alert → Support Decisions**

The goal is to shift project monitoring from **reactive status tracking to proactive risk identification**.

### Core Intelligence

| Project Data          | AI Analysis        | Actionable Insight    |
| --------------------- | ------------------ | --------------------- |
| Budget & expenditure  | Cost-risk analysis | Overrun risk          |
| Physical progress     | Progress analysis  | Progress gap          |
| Timeline & milestones | Delay prediction   | Expected delay        |
| Inspector remarks     | NLP analysis       | Critical risk signals |
| Multiple risk factors | Explainability     | Risk drivers          |

### What Makes DRISHTI Different?

> **Traditional monitoring asks:** “What is the current project status?”
> **DRISHTI additionally asks:** “What is the risk, what is driving it, and what should be monitored next?”

**DRISHTI is designed as an early-warning and decision-support layer—not just another project dashboard.**

---

## Key Features

1. **Executive Risk Dashboard**: Key Performance Indicators (Total Budget at Risk, High Risk Flagged Count, Predicted Cumulative Delay) and Chart.js decision-support visualizations (Department Risk Breakdown, Scatter Matrix, Risk Severity Distribution).
2. **ML Risk Score & Prediction Engine**: 
   - **Cost Risk Classification**: Trained Random Forest model predicting cost overrun probability and predicted cost overrun percentage.
   - **Schedule Delay Regression**: Trained Linear Regression model predicting project delay in months.
3. **Key Risk Factor Explainability**: Human-readable breakdown of top contributing risk factors (e.g. *"Budget utilization 85% leads progress 58% by 27%"*, *"Sub-optimal pace deficit: 1.9%/mo vs 7.0%/mo required"*).
4. **NLP Remarks Processing**: TF-IDF keyword extraction + Regex pattern matching identifying high-risk signals (*"land acquisition dispute"*, *"court stay"*, *"fund delay"*, *"labor strike"*).
5. **Early-Warning Alerts Feed**: Real-time threshold breach stream with severity levels (Critical, Warning, Info).
6. **PAIMANA / OCMS CSV Data Ingestion**: Drag-and-drop CSV upload tool to bulk import project records, automatically triggering ML & NLP evaluation pipelines.
7. **Decision-Support Action Plan**: Automated mitigation advice based on PAIMANA project monitoring protocols.

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Chart.js, react-chartjs-2, Lucide Icons, React Router DOM, Axios.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic v2.
- **Machine Learning & NLP**: Scikit-Learn (Random Forest, Linear Regression, TF-IDF Vectorizer), Pandas, NumPy.
- **Database**: SQLite (Zero-config local fallback `sqlite:///./drishti.db`) / PostgreSQL connection string support.

---

## Getting Started

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run FastAPI backend (Port 8008)
python -m uvicorn main:app --host 127.0.0.1 --port 8008 --reload
```

*The database will auto-create and auto-seed with 12+ realistic government infrastructure sample projects on initial launch.*

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run Vite development server (Port 5173)
npm run dev
```

Open `http://127.0.0.1:5173/` in your browser.

---

## Deployment Setup

- **Frontend (Vercel / Netlify)**: Standard React Vite build. Build command: `npm run build`, Output directory: `dist`.
- **Backend (Render / Railway / Heroku)**: Python FastAPI web service. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`. Configure `DATABASE_URL` environment variable for production PostgreSQL.
