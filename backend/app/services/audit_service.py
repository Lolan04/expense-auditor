import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.policy_service import search_policy

def audit_expense(merchant, amount, date, category, location, business_purpose, ocr_date=None) -> dict:

    try:
        amount_val = float(str(amount).replace('$','').replace(',','').strip())
    except:
        amount_val = 0.0

    policy_limits = {
        "New York": {"Meals":75,   "Transport":50,  "Lodging":250, "Conference":500, "Other":100},
        "London":   {"Meals":40,   "Transport":35,  "Lodging":200, "Conference":400, "Other":80},
        "Mumbai":   {"Meals":1200, "Transport":800, "Lodging":5000,"Conference":8000,"Other":2000},
        "Chicago":  {"Meals":60,   "Transport":45,  "Lodging":220, "Conference":450, "Other":90},
        "default":  {"Meals":50,   "Transport":30,  "Lodging":150, "Conference":300, "Other":60}
    }

    prohibited_keywords = [
        "alcohol","bar","club","casino","personal","party","entertainment",
        "spa","gym","shopping","vacation","holiday","nightclub","liquor","beer","wine"
    ]

    city_limits    = policy_limits.get(location, policy_limits["default"])
    limit          = city_limits.get(category, 50)
    policy_text    = search_policy(category, location)
    policy_snippet = f"Policy Section 3.1: {category} reimbursement limit for {location} is ${limit}."

    # ── RULE 0A: Future date ──────────────────────────────
    try:
        from datetime import datetime, date as dt_date
        claim_date_obj = datetime.strptime(date, "%Y-%m-%d").date()
        if claim_date_obj > dt_date.today():
            return {
                "status": "REJECTED",
                "reason": f"Claim date {date} is in the future. Expense claims cannot be submitted for future dates.",
                "policy_snippet": "Policy Section 1.1: Expense claims must not be submitted for future dates."
            }
    except:
        pass

    # ── RULE 0B: OCR date mismatch ────────────────────────
    try:
        from datetime import datetime
        if ocr_date and ocr_date != date:
            # Try to parse OCR date in common formats
            for fmt in ["%m/%d/%Y", "%d/%m/%Y", "%m-%d-%Y", "%d-%m-%Y", "%Y-%m-%d"]:
                try:
                    ocr_parsed  = datetime.strptime(ocr_date, fmt).strftime("%Y-%m-%d")
                    form_parsed = date
                    if ocr_parsed != form_parsed:
                        return {
                            "status": "FLAGGED",
                            "reason": f"Date on receipt ({ocr_date}) does not match the claimed expense date ({date}). Please verify and resubmit.",
                            "policy_snippet": "Policy Section 1.3: The date on the receipt must match the submitted claim date exactly."
                        }
                    break
                except:
                    continue
    except:
        pass

    # ── RULE 1: Prohibited keyword ────────────────────────
    found = [kw for kw in prohibited_keywords if kw in business_purpose.lower()]
    if found:
        return {
            "status": "REJECTED",
            "reason": f"Business purpose mentions '{found[0]}' which is explicitly prohibited under company policy.",
            "policy_snippet": "Policy Section 4.2: Alcohol, personal entertainment, nightclubs, casinos and gambling are strictly non-reimbursable."
        }

    # ── RULE 2: Zero amount ───────────────────────────────
    if amount_val == 0:
        return {
            "status": "FLAGGED",
            "reason": "Amount could not be determined. Manual review required.",
            "policy_snippet": policy_snippet
        }

    # ── RULE 3: Exceeds limit ─────────────────────────────
    if amount_val > limit:
        return {
            "status": "REJECTED",
            "reason": f"Claimed amount of ${amount_val:.2f} exceeds the {location} {category} policy limit of ${limit:.2f}.",
            "policy_snippet": f"Policy Section 3.1: {category} reimbursement limit for {location} is ${limit:.2f} per claim."
        }

    # ── RULE 4: Within 15% of limit ──────────────────────
    if amount_val > limit * 0.85:
        return {
            "status": "FLAGGED",
            "reason": f"Amount ${amount_val:.2f} is within 15% of the {location} {category} limit (${limit:.2f}). Senior finance review recommended.",
            "policy_snippet": "Policy Section 4.1: Claims within 15% of the spending limit require senior review before reimbursement."
        }

    # ── RULE 5: Weekend check ─────────────────────────────
    try:
        from datetime import datetime
        day = datetime.strptime(date, "%Y-%m-%d").strftime("%A")
        if day in ["Saturday", "Sunday"] and category in ["Meals", "Transport"]:
            return {
                "status": "FLAGGED",
                "reason": f"This expense was incurred on a {day}. Weekend {category} claims require prior written approval from the department head.",
                "policy_snippet": "Policy Section 5.3: Weekend and public holiday expenses require prior written approval from department head."
            }
    except:
        pass

    # ── RULE 6: Vague purpose ─────────────────────────────
    vague_words   = ["meeting","misc","other","general","various","stuff","lunch","dinner","travel"]
    purpose_clean = business_purpose.strip().lower()
    if len(purpose_clean) < 15:
        return {
            "status": "FLAGGED",
            "reason": "Business purpose is too vague or too short. Please provide a specific description.",
            "policy_snippet": "Policy Section 2.1: All expense claims must include a clear business justification of at least 15 characters."
        }
    if purpose_clean in vague_words:
        return {
            "status": "FLAGGED",
            "reason": f"Business purpose '{business_purpose}' is not specific enough. Please describe the actual business activity.",
            "policy_snippet": "Policy Section 2.1: Vague descriptions such as 'meeting', 'misc', or 'general' are not acceptable."
        }

    # ── ALL PASSED: APPROVED ──────────────────────────────
    return {
        "status": "APPROVED",
        "reason": f"Amount ${amount_val:.2f} is within the {location} {category} policy limit of ${limit:.2f}. Business purpose is clear and valid.",
        "policy_snippet": f"Policy Section 3.1: {category} limit for {location} is ${limit:.2f}. | {policy_text[:80]}..."
    }