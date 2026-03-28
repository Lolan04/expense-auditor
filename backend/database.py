import sqlite3
import os

DB_PATH = "claims.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_name TEXT,
            employee_email TEXT,
            category TEXT,
            location TEXT,
            business_purpose TEXT,
            claim_date TEXT,
            merchant TEXT,
            amount TEXT,
            receipt_path TEXT,
            status TEXT,
            reason TEXT,
            policy_snippet TEXT,
            override_status TEXT,
            override_comment TEXT,
            override_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def save_claim(data: dict) -> int:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        INSERT INTO claims (
            employee_name, employee_email, category, location,
            business_purpose, claim_date, merchant, amount,
            receipt_path, status, reason, policy_snippet
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data["employee_name"], data["employee_email"],
        data["category"], data["location"],
        data["business_purpose"], data["claim_date"],
        data["merchant"], data["amount"],
        data["receipt_path"], data["status"],
        data["reason"], data["policy_snippet"]
    ))
    conn.commit()
    claim_id = c.lastrowid
    conn.close()
    return claim_id

def get_all_claims():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM claims ORDER BY CASE status WHEN 'REJECTED' THEN 1 WHEN 'FLAGGED' THEN 2 ELSE 3 END, created_at DESC")
    rows = [dict(row) for row in c.fetchall()]
    conn.close()
    return rows

def get_claim_by_id(claim_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM claims WHERE id = ?", (claim_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def override_claim(claim_id: int, status: str, comment: str, by: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        UPDATE claims SET override_status=?, override_comment=?, override_by=?, status=?
        WHERE id=?
    ''', (status, comment, by, status, claim_id))
    conn.commit()
    conn.close()