import pytesseract
from PIL import Image
import re

def extract_receipt_data(image_path: str) -> dict:
    # Open the image and extract all text
    image = Image.open(image_path)
    raw_text = pytesseract.image_to_string(image)

    # Try to find amount using pattern like $50.00 or ₹500
    amount_match = re.search(r'[\$₹£€]?\s?(\d+\.?\d{0,2})', raw_text)
    amount = amount_match.group(1) if amount_match else "Not found"

    # Try to find a date like 27/03/2026 or March 27, 2026
    date_match = re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', raw_text)
    date = date_match.group() if date_match else "Not found"

    return {
        "raw_text": raw_text,
        "amount": amount,
        "date": date,
    }