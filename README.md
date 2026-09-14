# DRISHTI — Early Risk Detection System for Project Monitoring

DRISHTI is an AI-powered project risk monitoring system designed for government and enterprise infrastructure project oversight (inspired by PAIMANA / OCMS systems). It converts raw project tracking data (cost spent, physical progress, elapsed timeline, inspector remarks) into a unified **Risk Score (0–100)**, predicts cost overrun likelihood and schedule delays, provides feature importance explainability, and extracts NLP insights from free-text reports.

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
