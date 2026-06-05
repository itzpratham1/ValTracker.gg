import urllib.request
import sys

base_url = "http://127.0.0.1:5000"

try:
    print("Testing connection to dev server...")
    response = urllib.request.urlopen(base_url, timeout=5)
    html = response.read().decode('utf-8')
    print("Connection successful! Response status:", response.status)
    
    # Check for loading card container
    if 'id="landing-loading-card"' in html:
        print("[PASS] Found 'landing-loading-card' container in index.html")
    else:
        print("[FAIL] 'landing-loading-card' container NOT found in index.html")
        sys.exit(1)
        
    # Check for form wrapper
    if 'id="landing-lookup-form"' in html:
        print("[PASS] Found 'landing-lookup-form' wrapper in index.html")
    else:
        print("[FAIL] 'landing-lookup-form' wrapper NOT found in index.html")
        sys.exit(1)
        
    # Check for script functions
    if 'function startLoadingRotator()' in html:
        print("[PASS] Found 'startLoadingRotator' function in index.html")
    else:
        print("[FAIL] 'startLoadingRotator' function NOT found in index.html")
        sys.exit(1)
        
    if 'function stopLoadingRotator()' in html:
        print("[PASS] Found 'stopLoadingRotator' function in index.html")
    else:
        print("[FAIL] 'stopLoadingRotator' function NOT found in index.html")
        sys.exit(1)
        
    if 'function generateVctTrivia' in html:
        print("[PASS] Found 'generateVctTrivia' function in index.html")
    else:
        print("[FAIL] 'generateVctTrivia' function NOT found in index.html")
        sys.exit(1)

    print("\nChecking CSS styles...")
    css_response = urllib.request.urlopen(base_url + "/index.css", timeout=5)
    css = css_response.read().decode('utf-8')
    if '#landing-loading-card' in css:
        print("[PASS] Found loading card styles in index.css")
    else:
        print("[FAIL] Loading card styles NOT found in index.css")
        sys.exit(1)
        
    print("\nAll frontend elements verified successfully on dev server!")
    
except Exception as e:
    print("Failed to run tests:", e)
    sys.exit(1)
