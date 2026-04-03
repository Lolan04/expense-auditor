# 💸 ExpenseAI — Policy-First Expense Auditor

> An AI-powered expense auditing system that automatically reads receipts and cross-references them against company policy — delivering instant Approved, Flagged, or Rejected verdicts with zero manual effort.

🌐 **Live Demo:** https://expenseai-frontend-qv8b.onrender.com
⚙️ **Backend API:** https://expenseai-backend-t63s.onrender.com
💾 **GitHub:** https://github.com/Lolan04/expense-auditor

---

## 🎯 Problem Statement

Corporate finance teams manually cross-reference every employee expense receipt against a 40+ page Travel & Expense Policy — a process that is slow, inconsistent, and error-prone. Spending limits vary by category and location, policy language is often ambiguous, and the sheer volume of monthly receipts creates 3-week reimbursement backlogs. This results in **Spend Leakage** — non-compliant claims slipping through — and high operational costs.

**ExpenseAI eliminates this entirely using OCR + AI.**

---

## ✨ Features

### Feature 1 — Digital Receipt & Narrative Ingestion
- ✅ Upload receipts in **JPG, PNG, or PDF** format
- ✅ **OCR-powered extraction** of Merchant Name, Date, Total Amount, and Currency using Pytesseract
- ✅ Employee **Business Purpose** text field for spend context
- ✅ **Date validation** — automatically flags mismatch between receipt date and claimed expense date
- ✅ **Blurry/unreadable receipt detection** — rejects unclear uploads instantly

### Feature 2 — Automated Policy Cross-Reference Engine
- ✅ **Groq LLaMA 3.3 70B AI** checks every claim against full company policy
- ✅ Detects violations: meal limits, hotel limits, alcohol prohibition, transport class rules
- ✅ Every claim categorized as **Approved / Flagged / Rejected**
- ✅ One-sentence explanation **citing the exact policy rule that applies**
- ✅ Policy snippet displayed to employee and auditor

### Bonus Features Built
- ✅ **Finance Auditor Dashboard** — all claims sorted by priority (Rejected first)
- ✅ **Manual Override System** — auditors can change AI verdict with written justification
- ✅ **Claim ID Status Checker** — employees track reimbursement status anytime
- ✅ **Receipt image stored** and viewable by auditor in detail modal

---

## 🛠️ Tech Stack

| Layer | Technology | Why Chosen |
|---|---|---|
| Frontend | React.js | Fast, component-based, industry standard |
| Backend | FastAPI (Python) | High-performance async API, auto docs |
| OCR Engine | Pytesseract + Pillow | Accurate text extraction from images |
| PDF Support | PyMuPDF (fitz) | Converts PDF receipts to images for OCR |
| AI Auditor | Groq API — LLaMA 3.3 70B | Fast inference, free tier, accurate reasoning |
| Database | SQLite | Zero-config, lightweight, file-based |
| Deployment | Render + Docker | Free tier, auto-deploy from GitHub |

---

## 🚀 Run Locally — Step by Step

### Prerequisites
- Python 3.11+
- Node.js 18+
- Tesseract OCR installed → https://github.com/UB-Mannheim/tesseract/wiki
- Groq API Key (free) → https://console.groq.com/keys

---

### Step 1 — Clone Repository
```bash
git clone https://github.com/Lolan04/expense-auditor.git
cd expense-auditor
```

### Step 2 — Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

Create `.env` file in `backend/` folder:


Run backend:
```bash
uvicorn main:app --reload
```
✅ Backend live at: http://localhost:8000

Verify by opening http://localhost:8000 — should show:
```json
{"status": "ExpenseAI Backend Running", "groq_configured": true}
```

### Step 3 — Frontend Setup
```bash
cd ../frontend
npm install
```

Create `.env` file in `frontend/` folder:


Run frontend:
```bash
npm start
```
✅ Frontend live at: http://localhost:3000

---

## 📁 Project Structure


---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check + Groq status |
| POST | `/api/receipts/submit` | Submit receipt for OCR + AI audit |
| GET | `/api/receipts` | Get all receipts sorted by priority |
| GET | `/api/receipts/{id}` | Get full receipt detail with image |
| GET | `/api/receipts/status/{id}` | Employee claim status lookup |
| PATCH | `/api/receipts/{id}/override` | Auditor manual verdict override |

---

## 🏢 Policy Rules Engine

| Category | Rule Applied |
|---|---|
| Meals — Dinner | Max $50 per person |
| Meals — Lunch | Max $25 per person |
| Meals — Breakfast | Max $15 per person |
| Hotel | Max $200/night major cities, $150 elsewhere |
| Transport | Economy class only for flights under 6 hours |
| Alcohol | ❌ Never reimbursable under any circumstances |
| Entertainment | Requires pre-approval, max $100/person |
| Large Expenses | Over $500 requires manager pre-approval |
| Submission | Must be within 30 days of expense |

---

## 🧪 Test Cases

| Receipt Type | Expected Verdict |
|---|---|
| Lunch $22 at Subway | ✅ Approved |
| Dinner $125 at restaurant | ⚠️ Flagged — exceeds $50 limit |
| Alcohol purchase at bar | ❌ Rejected — alcohol not reimbursable |
| Hotel $280/night | ⚠️ Flagged — exceeds $200 limit |
| Flight economy $85 | ✅ Approved |
| Laptop $650 | ❌ Rejected — exceeds $500, needs pre-approval |

---

## 🌐 Deploy on Render

### Backend — Docker Service


### Frontend — Web Service


---

## 🔮 What I Would Improve With More Time

1. **Upload real Policy PDF** — parse and search it dynamically instead of hardcoded rules
2. **Employee authentication** — login system with role-based access (employee vs auditor)
3. **Email notifications** — auto-email employees when claim is approved or rejected
4. **Spending analytics** — charts showing department spend trends over time
5. **Multi-currency support** — auto-convert to USD using live exchange rates
6. **Mobile camera capture** — take receipt photo directly from phone camera
7. **Batch submission** — submit multiple receipts at once for a trip

---

## 👨‍💻 Author

**Abhiram**
Campus Recruitment Technical Challenge 2026
ExpenseAI — Policy-First Expense Auditor

---

## 📄 License

MIT License
