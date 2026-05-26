import json

try:
    with open("public/lineups.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        
    # Ascent Sova Lineups
    data["ascent"]["sova"][0]["steps"]["video_loop"] = "https://www.youtube.com/embed/k5jG4n9t1-E?start=268&autoplay=1&mute=1"
    data["ascent"]["sova"][1]["steps"]["video_loop"] = "https://www.youtube.com/embed/k5jG4n9t1-E?start=612&autoplay=1&mute=1"
    
    # Ascent Viper Lineup
    data["ascent"]["viper"][0]["steps"]["video_loop"] = "https://www.youtube.com/embed/8o99F6eLwos?start=85&autoplay=1&mute=1"
    
    # Ascent Killjoy Lineup
    data["ascent"]["killjoy"][0]["steps"]["video_loop"] = "https://www.youtube.com/embed/Pj15b6u1VqE?start=45&autoplay=1&mute=1"
    
    # Bind Sova Lineup
    data["bind"]["sova"][0]["steps"]["video_loop"] = "https://www.youtube.com/embed/3aGZkPSc_V8?start=30&autoplay=1&mute=1"
    
    # Bind Brimstone Lineup
    data["bind"]["brimstone"][0]["steps"]["video_loop"] = "https://www.youtube.com/embed/i0aZ9aEw8lA?start=15&autoplay=1&mute=1"
    
    # Bind Gekko Lineup
    data["bind"]["gekko"][0]["steps"]["video_loop"] = "https://www.youtube.com/embed/kU0Nstt3Zp0?start=60&autoplay=1&mute=1"
    
    # Haven Sova Lineup
    data["haven"]["sova"][0]["steps"]["video_loop"] = "https://www.youtube.com/embed/p17i8o1xZhs?start=120&autoplay=1&mute=1"
    
    # Haven Viper Lineup
    data["haven"]["viper"][0]["steps"]["video_loop"] = "https://www.youtube.com/embed/Wl7vUa9cpxY?start=40&autoplay=1&mute=1"
    
    # Split Viper Lineup
    data["split"]["viper"][0]["steps"]["video_loop"] = "https://www.youtube.com/embed/uG6R5w87yQ8?start=10&autoplay=1&mute=1"
    
    # Breeze Sova Lineup
    data["breeze"]["sova"][0]["steps"]["video_loop"] = "https://www.youtube.com/embed/_KplR397_Fk?start=50&autoplay=1&mute=1"
    
    # Sunset Gekko Lineup
    data["sunset"]["gekko"][0]["steps"]["video_loop"] = "https://www.youtube.com/embed/mK9L561lHms?start=15&autoplay=1&mute=1"

    with open("public/lineups.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print("lineups.json successfully upgraded with active, high-value YouTube guide timestamps!")
except Exception as e:
    print("Error:", e)
