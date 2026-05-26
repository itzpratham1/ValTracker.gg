import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Query a few different maps to verify aggregates
maps = ['ascent', 'bind', 'haven', 'split', 'breeze', 'sunset', 'lotus', 'icebox', 'abyss']

for m in maps:
    url = f"http://127.0.0.1:5000/api/v3/meta-comps?map={m}"
    print(f"\nQuerying: {url}")
    try:
        r = requests.get(url, timeout=5)
        print("Status code:", r.status_code)
        if r.status_code == 200:
            data = r.json()
            if data.get("total_comps_parsed", 0) > 0:
                print(f"  [SUCCESS] Map: {data.get('map')}, Patch: {data.get('patch')}, Total Comps: {data.get('total_comps_parsed')}")
                print(f"  VCT Meta Favorite (picks: {data['most_played_comp']['picks']}, WR: {data['most_played_comp']['win_rate']}%): {data['most_played_comp']['agents']}")
                print(f"  Elite Win-Rate Champion (picks: {data['highest_winrate_comp']['picks']}, WR: {data['highest_winrate_comp']['win_rate']}%): {data['highest_winrate_comp']['agents']}")
                
                # Show top 3 agents by pick rate
                stats = data.get("agent_stats", {})
                sorted_stats = sorted(stats.items(), key=lambda x: x[1]['pick_rate'], reverse=True)
                top_3 = [f"{ag} ({val['pick_rate']}% pick, {val['win_rate']}% WR)" for ag, val in sorted_stats[:3]]
                print(f"  Top 3 Pro Picks: {', '.join(top_3)}")
            else:
                print(f"  [NO DATA] {data.get('message')}")
        else:
            print("  Error content:", r.text)
    except Exception as e:
        print("  Failed with exception:", e)
