import json

map_splashes = {
    "ascent": "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
    "bind": "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png",
    "haven": "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png",
    "split": "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png",
    "breeze": "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png",
    "sunset": "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png"
}

# A few premium Riot CDN loop clips
v_loops = [
    "https://valorant.dyn.riotcdn.net/x/videos/release-12.09/72c8af91-f9f9-4044-801c-3e73ee2f2aa1_default_universal.mp4",
    "https://valorant.dyn.riotcdn.net/x/videos/release-12.09/b794b134-42d6-3138-188d-66a940a66304_default_universal.mp4",
    "https://valorant.dyn.riotcdn.net/x/videos/release-12.09/32f7797f-4491-e21f-e40b-cfb639df3c97_default_universal.mp4"
]

try:
    with open("public/lineups.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        
    v_idx = 0
    for map_key, agents in data.items():
        splash = map_splashes.get(map_key, "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png")
        for agent_key, lineups in agents.items():
            for l in lineups:
                # Update images to official splashes to guarantee they load perfectly
                l["steps"]["stand_img"] = splash
                l["steps"]["aim_img"] = splash
                # Update video to active streamed clip
                l["steps"]["video_loop"] = v_loops[v_idx % len(v_loops)]
                v_idx += 1
                
    with open("public/lineups.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print("lineups.json successfully updated with high-quality live CDN assets!")
except Exception as e:
    print("Error:", e)
