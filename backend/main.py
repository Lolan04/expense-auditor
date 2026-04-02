from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pytesseract
from PIL import Image, ImageFilter
import sqlite3
import os
import io
import base64
import re
import platform
from datetime import datetime
from typing import Optional
import fitz

# Auto-detect Windows or Linux
if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

try:
    from groq import Groq
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    AI_PROVIDER = "groq"
except:
    import openai
    openai.api_key = os.getenv("OPENAI_API_KEY")
    AI_PROVIDER = "openai"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

POLICY_TEXT = """
COMPANY TRAVEL & EXPENSE POLICY:
- Meals: Max $50/person for dinner, $25 for lunch, $15 for breakfast
- Hotel: Max $200/night in major cities, $150 elsewhere
- Transport: Economy class only for flights under 6 hours
- Alcohol: NOT reimbursable under any circumstances
- Entertainment: Requires pre-approval, max $100/person
- Team events on weekends require VP approval
- All receipts must be submitted within 30 days of expense
- Expenses over $500 require manager pre-approval
"""

def init_db():
    conn = sqlite3.connect('expenses.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_name TEXT,
        employee_email TEXT,
        expense_date TEXT,
        description TEXT,
        merchant_name TEXT,
        ocr_date TEXT,
        ocr_amount TEXT,
        ocr_currency TEXT,
        ocr_raw TEXT,
        status TEXT DEFAULT 'Pending',
        ai_verdict TEXT DEFAULT 'Pending',
        ai_explanation TEXT,
        policy_snippet TEXT,
        override_comment TEXT,
        override_by TEXT,
        receipt_image_base64 TEXT,
        created_at TEXT
    )''')
    for col in ["override_comment","override_by","policy_snippet","receipt_image_base64"]:
        try:
            c.execute(f"ALTER TABLE receipts ADD COLUMN {col} TEXT")
        except:
            pass
    conn.commit()
    conn.close()

init_db()


def is_blurry(image: Image.Image) -> bool:
    gray = image.convert('L')
    filtered = gray.filter(ImageFilter.FIND_EDGES)
    import statistics
    pixels = list(filtered.getdata())
    if len(pixels) == 0:
        return True
    return statistics.variance(pixels) < 100


def extract_receipt_data(image: Image.Image):
    try:
        raw_text = pytesseract.image_to_string(image)
    except Exception as e:
        return "Unknown", "Not found", "USD", None, str(e), "OK"
    if len(raw_text.strip()) < 20:
        return "Unknown", "Not found", "USD", None, raw_text, "OK"
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
    merchant = lines[0] if lines else "Unknown"
    amount_match = re.search(r'[\$£€]?\s*(\d+[\.,]\d{2})', raw_text)
    amount = amount_match.group(0).strip() if amount_match else "Not found"
    currency = "USD"
    if "£" in raw_text: currency = "GBP"
    elif "€" in raw_text: currency = "EUR"
    elif "₹" in raw_text: currency = "INR"
    date_match = re.search(r'(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})', raw_text)
    ocr_date = date_match.group(0) if date_match else None
    return merchant, amount, currency, ocr_date, raw_text, "OK"


def validate_dates(expense_date: str, ocr_date: Optional[str]) -> Optional[str]:
    if not ocr_date or not expense_date:
        return None
    try:
        for fmt in ["%d/%m/%Y","%m/%d/%Y","%d-%m-%Y","%Y-%m-%d","%d.%m.%Y"]:
            try:
                parsed_ocr = datetime.strptime(ocr_date, fmt)
                parsed_expense = datetime.strptime(expense_date, "%Y-%m-%d")
                if abs((parsed_ocr - parsed_expense).days) > 3:
                    return f"Date mismatch: Receipt shows {ocr_date} but expense date is {expense_date}"
                return None
            except:
                continue
    except:
        pass
    return None


def ai_audit(merchant, amount, currency, description, expense_date, ocr_raw):
    prompt = f"""You are a corporate expense auditor. Audit this expense against company policy.

COMPANY POLICY:
{POLICY_TEXT}

EXPENSE DETAILS:
- Merchant: {merchant}
- Amount: {amount} {currency}
- Employee Description: {description}
- Expense Date: {expense_date}
- Receipt OCR Text: {ocr_raw[:500]}

Respond in this exact JSON format:
{{
  "verdict": "Approved" or "Flagged" or "Rejected",
  "explanation": "One sentence citing specific policy rule",
  "policy_snippet": "The exact policy rule that applies",
  "risk_level": "Low" or "Medium" or "High"
}}"""
    try:
        if AI_PROVIDER == "groq":
            response = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            result_text = response.choices[0].message.content
        else:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            result_text = response.choices[0].message.content
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if json_match:
            import json
            data = json.loads(json_match.group())
            return data.get("verdict","Flagged"), data.get("explanation",""), data.get("policy_snippet",""), data.get("risk_level","Medium")
    except Exception as e:
        print(f"AI error: {e}")
    return "Flagged", "Could not complete AI audit - please review manually", "N/A", "Medium"


@app.get("/")
def root():
    return {"status": "ExpenseAI Backend Running"}


@app.post("/api/receipts/submit")
async def submit_receipt(
    file: UploadFile = File(...),
    employee_name: str = Form(...),
    employee_email: str = Form(...),
    expense_date: str = Form(...),
    description: str = Form(...)
):
    contents = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        try:
            pdf_doc = fitz.open(stream=contents, filetype="pdf")
            page = pdf_doc[0]
            pix = page.get_pixmap(dpi=200)
            image = Image.open(io.BytesIO(pix.tobytes("png")))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not read PDF: {str(e)}")
    elif filename.endswith((".jpg",".jpeg",".png",".webp")):
        try:
            image = Image.open(io.BytesIO(contents))
        except:
            raise HTTPException(status_code=400, detail="Could not read image file")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file. Upload JPG, PNG, or PDF.")

    date_warning = None
    merchant, amount, currency, ocr_date, ocr_raw, ocr_status = extract_receipt_data(image)
    date_warning = validate_dates(expense_date, ocr_date)

    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    img_base64 = base64.b64encode(buffered.getvalue()).decode()

    verdict, explanation, policy_snippet, risk_level = ai_audit(
        merchant, amount, currency, description, expense_date, ocr_raw
    )

    if date_warning:
        explanation = f"{explanation} | WARNING: {date_warning}"

    conn = sqlite3.connect('expenses.db')
    c = conn.cursor()
    c.execute('''INSERT INTO receipts
        (employee_name, employee_email, expense_date, description,
         merchant_name, ocr_date, ocr_amount, ocr_currency, ocr_raw,
         status, ai_verdict, ai_explanation, policy_snippet,
         receipt_image_base64, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
        (employee_name, employee_email, expense_date, description,
         merchant, ocr_date, amount, currency, ocr_raw[:1000],
         verdict, verdict, explanation, policy_snippet, img_base64,
         datetime.now().isoformat()))
    receipt_id = c.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": receipt_id,
        "merchant": merchant,
        "amount": amount,
        "currency": currency,
        "ocr_date": ocr_date,
        "date_warning": date_warning,
        "verdict": verdict,
        "explanation": explanation,
        "policy_snippet": policy_snippet,
        "status": verdict
    }


@app.get("/api/receipts")
def get_receipts():
    conn = sqlite3.connect('expenses.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('''SELECT id, employee_name, employee_email, expense_date,
                 description, merchant_name, ocr_amount, ocr_currency,
                 ai_verdict, ai_explanation, policy_snippet,
                 override_comment, override_by, created_at
                 FROM receipts ORDER BY
                 CASE ai_verdict
                   WHEN "Rejected" THEN 1
                   WHEN "Flagged" THEN 2
                   ELSE 3 END,
                 created_at DESC''')
    rows = [dict(row) for row in c.fetchall()]
    conn.close()
    return rows


@app.get("/api/receipts/{receipt_id}")
def get_receipt_detail(receipt_id: int):
    conn = sqlite3.connect('expenses.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM receipts WHERE id = ?", (receipt_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return dict(row)


@app.get("/api/receipts/status/{receipt_id}")
def check_status(receipt_id: int):
    conn = sqlite3.connect('expenses.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('''SELECT id, employee_name, merchant_name, ocr_amount,
                 ai_verdict, ai_explanation, override_comment, created_at
                 FROM receipts WHERE id = ?''', (receipt_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Claim not found")
    return dict(row)


class OverrideRequest(BaseModel):
    new_verdict: str
    comment: str
    auditor_name: str


@app.patch("/api/receipts/{receipt_id}/override")
def override_receipt(receipt_id: int, body: OverrideRequest):
    if body.new_verdict not in ["Approved","Flagged","Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid verdict")
    conn = sqlite3.connect('expenses.db')
    c = conn.cursor()
    c.execute('''UPDATE receipts
                 SET ai_verdict=?, override_comment=?, override_by=?
                 WHERE id=?''',
              (body.new_verdict, body.comment, body.auditor_name, receipt_id))
    if c.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Receipt not found")
    conn.commit()
    conn.close()
    return {"message": "Override applied successfully", "new_verdict": body.new_verdict}