import os

POLICY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "policy.txt"
)

def load_policy():
    try:
        with open(POLICY_PATH, "r") as f:
            return f.read()
    except:
        return "General company expense policy applies."

def search_policy(category: str, location: str) -> str:
    policy = load_policy()
    lines  = policy.split('\n')
    relevant = []
    keywords = [
        category.upper(), category.lower(),
        location.upper(), location.lower(),
        "PROHIBITED", "WEEKEND", "JUSTIFICATION", "LIMIT"
    ]
    for i, line in enumerate(lines):
        if any(kw in line for kw in keywords):
            start = max(0, i - 1)
            end   = min(len(lines), i + 3)
            relevant.extend(lines[start:end])
    result = '\n'.join(dict.fromkeys(relevant))
    return result if result.strip() else f"General policy limits apply for {category} in {location}."