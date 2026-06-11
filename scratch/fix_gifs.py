"""
Re-compress original high-res GIFs from the git history isn't possible,
so instead we'll rebuild the GIFs from scratch using the original compressed ones
but fixing the per-frame duration to be correct (80-100ms).

The issue: the first compression pass inherited the already-inflated duration,
making each frame display for 9 seconds. We fix that by resetting duration to 80ms.
"""
import os
from PIL import Image, ImageSequence

public_dir = r"c:\Users\prath\Downloads\VALSTATS\v8\public"

gifs = {
    "deep_analysis.gif": 80,   # ms per frame
    "perf_lab.gif": 80,
}

for gif_name, target_duration in gifs.items():
    gif_path = os.path.join(public_dir, gif_name)
    if not os.path.exists(gif_path):
        print(f"Not found: {gif_name}")
        continue

    print(f"\nFixing {gif_name}...")
    with Image.open(gif_path) as im:
        total_frames = getattr(im, 'n_frames', 1)
        original_size = os.path.getsize(gif_path)
        orig_loop = im.info.get('loop', 0)
        print(f"  Frames: {total_frames}, Size: {im.size}, Current duration: {im.info.get('duration')}ms")

        frames = []
        for i in range(total_frames):
            im.seek(i)
            frames.append(im.convert("P", palette=Image.Palette.ADAPTIVE, colors=128))

    # Re-save with correct frame duration
    out_path = gif_path
    frames[0].save(
        out_path,
        save_all=True,
        append_images=frames[1:],
        optimize=True,
        duration=target_duration,
        loop=orig_loop
    )

    new_size = os.path.getsize(out_path)
    print(f"  Fixed: {new_size/1024/1024:.2f} MB, duration now {target_duration}ms/frame")

print("\nVerifying...")
for gif_name in gifs:
    path = os.path.join(public_dir, gif_name)
    with Image.open(path) as im:
        print(f"  {gif_name}: {getattr(im, 'n_frames', 1)} frames, {im.size}, duration={im.info.get('duration')}ms")
