from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
import shutil, os, sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.audit_service import audit_expense
from services.email_service import send_notification
from database import init_db, save_claim, get_all_claims, get_claim_by_id, override_claim

init_db()
router = APIRouter()


def extract_with_ocr(file_path: str, fallback_name: str, form_amount: str, form_date: str) -> dict:
    """Try OCR first, fall back to form data if Tesseract not installed."""
    try:
        import pytesseract
        from PIL import Image

        # Windows Tesseract path
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

        image    = Image.open(file_path)
        raw_text = pytesseract.image_to_string(image)
        lines    = [l.strip() for l in raw_text.split('\n') if l.strip()]

        # Try to extract amount from OCR text
        import re
        amount_match = re.search(r'[\$£€]?\s*(\d+[\.,]\d{2})', raw_text)
        ocr_amount   = amount_match.group(1).replace(',', '.') if amount_match else form_amount

        # Try to extract date from OCR text
        date_match = re.search(r'(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', raw_text)
        ocr_date   = date_match.group(1) if date_match else form_date

        # Try to extract merchant — first meaningful line
        merchant = lines[0].title() if lines else fallback_name

        # Check if image is blurry (very few characters extracted)
        is_blurry = len(raw_text.strip()) < 20

        return {
            "merchant":  merchant,
            "amount":    ocr_amount,
            "date":      form_date,   # always trust form date for audit
            "ocr_date":  ocr_date,
            "currency":  "USD",
            "ocr_used":  True,
            "blurry":    is_blurry,
            "raw_chars": len(raw_text.strip())
        }

    except Exception:
        # Tesseract not installed or failed — use form data
        return {
            "merchant": fallback_name,
            "amount":   form_amount,
            "date":     form_date,
            "ocr_date": form_date,
            "currency": "USD",
            "ocr_used": False,
            "blurry":   False,
            "raw_chars": 0
        }


@router.post("/submit")
async def submit_receipt(
    file:             UploadFile = File(...),
    employee_name:    str = Form(...),
    employee_email:   str = Form(...),
    category:         str = Form(...),
    location:         str = Form(...),
    business_purpose: str = Form(...),
    claim_date:       str = Form(...),
    amount:           str = Form(...)
):
    # 1. Save uploaded file
    os.makedirs("uploads", exist_ok=True)
    safe_name = file.filename.replace(" ", "_")
    filename  = f"{employee_name.replace(' ','_')}_{safe_name}"
    file_path = f"uploads/{filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. Fallback merchant name from filename
    fallback_merchant = safe_name.replace("_", " ").split(".")[0].title()

    # 3. Try OCR extraction
    ocr_data = extract_with_ocr(file_path, fallback_merchant, amount, claim_date)

    # 4. Blurry receipt warning → FLAGGED immediately
    if ocr_data["blurry"]:
        audit_result = {
            "status": "FLAGGED",
            "reason": "Receipt image appears blurry or unreadable. Please re-upload a clearer image.",
            "policy_snippet": "Policy Section 1.2: All submitted receipts must be clearly legible for audit processing."
        }
    else:
        # 5. Run AI Policy Audit
        audit_result = audit_expense(
            merchant=ocr_data["merchant"],
            amount=float(amount),           # always use form amount for reliable audit
            date=claim_date,
            category=category,
            location=location,
            business_purpose=business_purpose,
            ocr_date=ocr_data["ocr_date"]   # pass OCR date for mismatch check
        )

    # 6. Save claim to DB
    claim_id = save_claim({
        "employee_name":    employee_name,
        "employee_email":   employee_email,
        "category":         category,
        "location":         location,
        "business_purpose": business_purpose,
        "claim_date":       claim_date,
        "merchant":         ocr_data["merchant"],
        "amount":           amount,
        "receipt_path":     file_path,
        "status":           audit_result["status"],
        "reason":           audit_result["reason"],
        "policy_snippet":   audit_result["policy_snippet"]
    })

    # 7. Send email notification
    send_notification(
        to_email=employee_email,
        employee_name=employee_name,
        status=audit_result["status"],
        reason=audit_result["reason"],
        claim_id=claim_id
    )

    return {
        "claim_id": claim_id,
        "employee": employee_name,
        "ocr_data": ocr_data,
        "audit":    audit_result
    }


@router.get("/all")
def all_claims():
    return get_all_claims()


@router.get("/{claim_id}")
def single_claim(claim_id: int):
    claim = get_claim_by_id(claim_id)
    if not claim:
        return {"error": "Claim not found"}
    return claim


class OverrideRequest(BaseModel):
    status:  str
    comment: str
    by:      str


@router.put("/override/{claim_id}")
def apply_override(claim_id: int, body: OverrideRequest):
    override_claim(claim_id, body.status, body.comment, body.by)
    claim = get_claim_by_id(claim_id)
    if claim:
        send_notification(
            to_email=claim["employee_email"],
            employee_name=claim["employee_name"],
            status=body.status,
            reason=f"Finance team override: {body.comment}",
            claim_id=claim_id
        )
    return {"message": "Override applied successfully", "claim_id": claim_id}