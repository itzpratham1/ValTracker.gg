import os
from PIL import Image

def process_logo(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"Input file not found: {input_path}")
        return
        
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # Key out black background (where R, G, B are all low)
        r, g, b, a = item
        if r < 30 and g < 30 and b < 30:
            new_data.append((0, 0, 0, 0)) # Make transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Get bounding box of non-transparent content
    bbox = img.getbbox()
    if bbox:
        # Add a tiny 2px padding to avoid sharp edges being clipped
        cropped_img = img.crop(bbox)
        # Resize/save
        cropped_img.save(output_path, "PNG")
        print(f"Successfully created transparent logo at: {output_path}")
    else:
        print("Failed to find bounding box, saving original keyed image")
        img.save(output_path, "PNG")

process_logo("public/logo.jpg", "public/logo.png")
