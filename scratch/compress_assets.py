import os
from PIL import Image, ImageSequence

public_dir = r"c:\Users\prath\Downloads\VALSTATS\v8\public"

images_to_convert = [
    "stats_tracker_card.png",
    "Val_bot_analysis.png",
    "deep_analysis.png",
    "skin_store.png",
    "meta_comp.png",
    "obs_overlay.png",
    "valorant_v_logo.png",
    "VCT_Esports.png"
]

print("--- PNG to WebP Conversion Analysis ---")
for img_name in images_to_convert:
    img_path = os.path.join(public_dir, img_name)
    if os.path.exists(img_path):
        orig_size = os.path.getsize(img_path)
        webp_name = img_name.rsplit(".", 1)[0] + ".webp"
        webp_path = os.path.join(public_dir, webp_name)
        
        try:
            with Image.open(img_path) as im:
                im.save(webp_path, "WEBP", quality=80)
            webp_size = os.path.getsize(webp_path)
            reduction = (orig_size - webp_size) / orig_size * 100
            print(f"{img_name}: {orig_size/1024/1024:.2f} MB -> {webp_name}: {webp_size/1024/1024:.2f} MB ({reduction:.1f}% reduction)")
        except Exception as e:
            print(f"Error converting {img_name}: {e}")

gifs_to_optimize = [
    "deep_analysis.gif",
    "perf_lab.gif"
]

print("\n--- GIF Optimization Analysis ---")
for gif_name in gifs_to_optimize:
    gif_path = os.path.join(public_dir, gif_name)
    if os.path.exists(gif_path):
        orig_size = os.path.getsize(gif_path)
        print(f"Inspecting {gif_name} (original size: {orig_size/1024/1024:.2f} MB)...")
        try:
            with Image.open(gif_path) as im:
                frames = [frame.copy() for frame in ImageSequence.Iterator(im)]
                print(f"  Total frames: {len(frames)}, Size: {im.size}")
                
                width, height = im.size
                target_width = 600
                scale = target_width / width
                target_height = int(height * scale)
                
                print(f"  Resizing from {im.size} to {target_width}x{target_height}...")
                resized_frames = []
                for idx, frame in enumerate(frames):
                    # Skip 3 out of 4 frames to cut down frame count drastically (and make duration fit)
                    if idx % 4 == 0:
                        f_conv = frame.convert("RGBA")
                        f_resized = f_conv.resize((target_width, target_height), Image.Resampling.LANCZOS)
                        resized_frames.append(f_resized)
                
                opt_gif_name = gif_name.rsplit(".", 1)[0] + "_opt.gif"
                opt_gif_path = os.path.join(public_dir, opt_gif_name)
                
                # Convert back to P mode with palette
                quantized_frames = []
                for rf in resized_frames:
                    # method=2 corresponds to Fast Octree, which is valid for RGBA
                    quantized_frames.append(rf.quantize(colors=128, method=2))
                
                orig_duration = im.info.get("duration", 100)
                if not orig_duration:
                    orig_duration = 100
                
                quantized_frames[0].save(
                    opt_gif_path,
                    save_all=True,
                    append_images=quantized_frames[1:],
                    optimize=True,
                    duration=orig_duration * 4,  # Multiply by 4 since we keep 1 in 4 frames
                    loop=im.info.get("loop", 0)
                )
                
                opt_size = os.path.getsize(opt_gif_path)
                reduction = (orig_size - opt_size) / orig_size * 100
                print(f"  Optimized to {opt_gif_name}: {opt_size/1024/1024:.2f} MB ({reduction:.1f}% reduction)")
        except Exception as e:
            print(f"Error optimizing {gif_name}: {e}")
