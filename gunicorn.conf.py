import os

# Number of workers — 2 is safe for Render free tier (512MB RAM)
# Each worker uses ~100-150MB. 2 workers = parallel request handling.
workers = 2

# Single-threaded sync workers are most stable for this workload
worker_class = "sync"

# Bind to PORT env var (Render injects this automatically)
bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"

# Kill workers that hang for more than 60 seconds (e.g. slow scrapes)
timeout = 60

# Keep connections alive for 5 seconds (reduces TCP handshake overhead)
keepalive = 5

# Silence noisy access logs in production to save RAM on I/O
accesslog = "-"
errorlog = "-"
loglevel = "warning"
