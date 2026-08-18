import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.feature_11_copilot.service import CopilotService

arbitrary_questions = [
    ("What was the highest load in 2017 for AEP?", "AEP"),
    ("What is the average consumption on Mondays for PJME?", "PJME"),
    ("How many hours exceeded 20000 in AEP?", "AEP"),
    ("What was the minimum baseload in July for COMED?", "COMED"),
    ("Calculate the total energy and variance in 2016 for PJME", "PJME")
]

print("=" * 80)
print("TESTING ARBITRARY DYNAMIC DATA ANALYTICS")
print("=" * 80)

for q, reg in arbitrary_questions:
    print(f"\nQuestion: \"{q}\" (Region: {reg})")
    resp = CopilotService.process_query(
        question=q,
        active_region=reg,
        user_role="admin",
        assigned_region="ALL"
    )
    print(f"Source: {resp.get('source')}")
    print(f"Answer:\n{resp.get('answer')}")
    print("-" * 60)
