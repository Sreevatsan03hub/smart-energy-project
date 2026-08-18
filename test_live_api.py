import urllib.request
import json

payload = {
    "question": "Calculate the total cost in 2017 for AEP at $0.12/kWh",
    "active_region": "AEP",
    "user_role": "admin",
    "assigned_region": "ALL",
    "conversation_history": []
}

req = urllib.request.Request(
    "http://127.0.0.1:8000/api/chatbot/query",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode("utf-8"))
        print("HTTP 200 OK — API Response Received:")
        print("Source:", res.get("source"))
        print("Answer preview:\n", res.get("answer")[:300])
except Exception as e:
    print("HTTP Error:", e)
