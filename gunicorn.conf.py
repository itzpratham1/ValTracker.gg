import os

# Single worker with 8 threads for Render free tier (512MB RAM)
# Using gthread worker_class enables concurrent request handling
# so HTTP health check probes (/api/health) are processed instantly
# even while other threads are waiting on external network I/O (HenrikDev / Supabase / VLR scraping).
workers = 1
worker_class = "gthread"
threads = 8

# Bind to PORT env var (Render injects this automatically)
bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"

# Worker timeout after 60 seconds (prevents worker hangs without killing legitimate scrapes)
timeout = 60
graceful_timeout = 10

# Keep connections alive for 5 seconds (reduces TCP handshake overhead)
keepalive = 5

# Silence noisy access logs in production to save RAM on I/O
accesslog = "-"
errorlog = "-"
loglevel = "warning"

# Preload app to share memory and accelerate worker startup
preload_app = True

