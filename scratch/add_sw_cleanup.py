import os

html_path = r"c:\Users\prath\Downloads\VALSTATS\v8\public\index.html"

with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

target = "</body>"
replacement = """<!-- ── SERVICE WORKER CLEANUP ── -->
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (var registration of registrations) {
      registration.unregister().then(function(success) {
        if (success) console.log('Successfully unregistered service worker.');
      });
    }
  });
}
if ('caches' in window) {
  caches.keys().then(function(keys) {
    keys.forEach(function(key) {
      caches.delete(key).then(function() {
        console.log('Cleared cache:', key);
      });
    });
  });
}
</script>
</body>"""

# Try direct replacement
if target in content:
    content = content.replace(target, replacement)
    print("Replaced successfully (LF)")
else:
    print("Target not found!")

# Bump the CSS version of index.css to force style reload (desktop code had v13.09 or similar)
# Let's search for index.css?v in the content
import re
match = re.search(r'index\.css\?v=([\d\.]+)', content)
if match:
    old_ver = match.group(0)
    # Let's bump it to v13.99 to make sure it's higher than any cached version
    new_ver = 'index.css?v=13.99'
    content = content.replace(old_ver, new_ver)
    print(f"Bumped CSS version from {old_ver} to {new_ver}")
else:
    print("CSS version parameter not found!")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Finished!")
