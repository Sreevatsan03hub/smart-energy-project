import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.feature_11_copilot.service import CopilotService

cost_queries = [
    ("Calculate the total cost in 2017 for AEP at $0.12/kWh", "AEP"),
    ("What was the total energy cost for PJME in July at a tariff of $0.15/kWh?", "PJME"),
    ("Calculate total financial expenditure for COMED in 2016", "COMED"),
    ("What was the average daily cost for DAYTON on weekends?", "DAYTON")
]

for q, reg in cost_queries:
    print(f"\nQuery: \"{q}\" (Region: {reg})")
    resp = CopilotService.process_query(
        question=q,
        active_region=reg,
        user_role="admin",
        assigned_region="ALL"
    )
    print(f"Source: {resp.get('source')}")
    print(f"Answer:\n{resp.get('answer')}")
    print("=" * 60)
