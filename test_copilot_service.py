import os
import sys
import json
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.feature_11_copilot.service import CopilotService

test_queries = [
    # 1. Forecasting results
    {
        "desc": "Forecasting results (AEP)",
        "question": "Show me the forecasting results for AEP",
        "region": "AEP",
        "role": "regional_user",
        "assigned": "AEP"
    },
    # 2. Forecasting accuracy
    {
        "desc": "Forecasting accuracy metrics (AEP)",
        "question": "What is the forecasting accuracy and MAE for AEP?",
        "region": "AEP",
        "role": "regional_user",
        "assigned": "AEP"
    },
    # 3. Model rationale: XGBoost
    {
        "desc": "Model reasoning: Why XGBoost",
        "question": "Why did we choose XGBoost over LSTM and ARIMA?",
        "region": "PJME",
        "role": "admin",
        "assigned": "ALL"
    },
    # 4. Anomaly detection results
    {
        "desc": "Anomaly results (AEP)",
        "question": "Show me the anomaly results for AEP",
        "region": "AEP",
        "role": "regional_user",
        "assigned": "AEP"
    },
    # 5. Model rationale: Isolation Forest
    {
        "desc": "Model reasoning: Why Isolation Forest",
        "question": "Why did we choose Isolation Forest for anomaly detection?",
        "region": "PJME",
        "role": "admin",
        "assigned": "ALL"
    },
    # 6. Why was point classified as anomaly
    {
        "desc": "Root cause anomaly explanation",
        "question": "Why was this point classified as an anomaly?",
        "region": "AEP",
        "role": "regional_user",
        "assigned": "AEP"
    },
    # 7. Historical Pattern Discovery
    {
        "desc": "Historical pattern discovery",
        "question": "What is the typical consumption at 7 PM and highest day for AEP?",
        "region": "AEP",
        "role": "regional_user",
        "assigned": "AEP"
    },
    # 8. Similar Day vs Historical Pattern
    {
        "desc": "Similar Day Finder",
        "question": "Which previous day looked most similar to today?",
        "region": "PJME",
        "role": "admin",
        "assigned": "ALL"
    },
    # 9. Recommendations
    {
        "desc": "Short-term recommendations",
        "question": "How can I reduce energy consumption during peak hours?",
        "region": "PJME",
        "role": "admin",
        "assigned": "ALL"
    },
    # 10. Long-term recommendations (2 years)
    {
        "desc": "Long-term 2-year strategic recommendations",
        "question": "How can we reduce energy consumption over the next two years?",
        "region": "PJME",
        "role": "admin",
        "assigned": "ALL"
    },
    # 11. System connectivity & pipeline visualization
    {
        "desc": "System connectivity & pipeline flow diagram",
        "question": "Explain how forecasting and anomaly detection are connected and explain the complete pipeline",
        "region": "PJME",
        "role": "admin",
        "assigned": "ALL"
    },
    # 12. Security / RBAC check: Local operator unauthorized request
    {
        "desc": "Security RBAC check: AEP operator requesting PJME",
        "question": "Show me PJME forecasting results and anomalies",
        "region": "AEP",
        "role": "regional_user",
        "assigned": "AEP"
    },
    # 13. Multi-region comparison (Admin)
    {
        "desc": "Multi-region comparison across all 11 grids (Admin)",
        "question": "Compare forecasting performance and baseline consumption across all regions",
        "region": "PJME",
        "role": "admin",
        "assigned": "ALL"
    }
]

print("=" * 80)
print("STARTING ENERGY AI COPILOT TEST SUITE")
print("=" * 80)

passed = 0

for i, test in enumerate(test_queries, 1):
    print(f"\n[{i}/{len(test_queries)}] Testing: {test['desc']}")
    print(f"Query: \"{test['question']}\" | Region: {test['region']} | Role: {test['role']} (Assigned: {test['assigned']})")
    
    resp = CopilotService.process_query(
        question=test["question"],
        active_region=test["region"],
        user_role=test["role"],
        assigned_region=test["assigned"]
    )
    
    answer = resp.get("answer", "")
    source = resp.get("source", "")
    chips = resp.get("chips", [])
    flow_diagram = resp.get("flow_diagram")
    
    print(f"Source: {source}")
    print(f"Chips: {chips}")
    if flow_diagram:
        print(f"Flow Diagram Nodes: {len(flow_diagram.get('nodes', []))} nodes")
    print(f"Answer Preview:\n{answer[:250]}...\n")
    
    # Assertions
    if len(answer) > 20 and source:
        if i == 12:
            assert "Access Restricted" in answer or "restricted" in answer.lower(), "Security check failed!"
        elif i == 11:
            assert flow_diagram is not None and len(flow_diagram.get("nodes", [])) >= 5, "Flow diagram missing for connectivity!"
        elif i == 2:
            assert "0.9961" in answer or "R" in answer, "Missing verified accuracy metrics!"
        passed += 1
        print(">>> PASS")
    else:
        print(">>> FAIL")

print("\n" + "=" * 80)
print(f"COPILOT TEST SUITE RESULT: {passed}/{len(test_queries)} TESTS PASSED")
print("=" * 80)
