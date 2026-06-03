import sys
import os

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def search_file(filepath, query):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    print(f"Searching for '{query}' in {filepath}...")
    count = 0
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        for idx, line in enumerate(f, 1):
            if query.lower() in line.lower():
                try:
                    print(f"L{idx}: {line.strip()}")
                except Exception:
                    # Fallback to ascii representation or ignore if print fails
                    print(f"L{idx}: {line.strip().encode('ascii', 'replace').decode('ascii')}")
                count += 1
                if count >= 100:
                    print("... too many results, truncated ...")
                    break
    print(f"Found {count} matches.")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        search_file(r'c:\Users\prath\Downloads\VALSTATS\v8\public\index.html', 'DOMContentLoaded')
    else:
        search_file(sys.argv[1], sys.argv[2])
