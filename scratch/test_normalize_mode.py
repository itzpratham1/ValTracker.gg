import sys
import os

# Add parent directory to path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from app import normalize_mode
except ImportError as e:
    print("Could not import normalize_mode from app.py. Error:", e)
    sys.exit(1)

test_cases = [
    ("Competitive", "competitive"),
    ("competitive", "competitive"),
    ("Unrated", "unrated"),
    ("Deathmatch", "deathmatch"),
    ("Team Deathmatch", "teamdeathmatch"),
    ("Team DM", "teamdeathmatch"),  # Since we map teamdm to teamdeathmatch
    ("team-dm", "teamdeathmatch"),
    ("Swiftplay", "swiftplay"),
    ("Spike Rush", "spikerush"),
    ("spikerush", "spikerush"),
    ("Escalation", "escalation"),
    ("Snowball Fight", "snowballfight"),
    (None, ""),
    ("", "")
]

failed = 0
for raw, expected in test_cases:
    actual = normalize_mode(raw)
    if actual == expected:
        print(f"PASS: '{raw}' -> '{actual}'")
    else:
        print(f"FAIL: '{raw}' -> Expected '{expected}', got '{actual}'")
        failed += 1

if failed == 0:
    print("ALL TESTS PASSED!")
    sys.exit(0)
else:
    print(f"{failed} TESTS FAILED!")
    sys.exit(1)
