import os

# Single worker is safest for Render free tier (512MB RAM)
# 2 workers would duplicate ALL in-memory caches, causing OOM
workers = 1

# Single-threaded sync workers are most stable for this workload
worker_class = "sync"

# Bind to PORT env var (Render injects this automatically)
bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"

# Kill workers that hang for more than 30 seconds (e.g. slow VLR scrapes)
# With 1 worker, a hang means the entire site is down
timeout = 30

# Keep connections alive for 5 seconds (reduces TCP handshake overhead)
keepalive = 5

# Silence noisy access logs in production to save RAM on I/O
accesslog = "-"
errorlog = "-"
loglevel = "warning"
