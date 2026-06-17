FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Flask API
COPY app.py api.py gunicorn.conf.py ./
COPY shared_meta.json ./
COPY vlr_matches_backup.json vlr_results_backup.json vlr_news_backup.json store_featured_backup.json ./

# Copy frontend build artifacts
COPY frontend/public/ frontend/public/
COPY frontend/dist/ frontend/dist/

# Copy static data files needed by API
COPY frontend/public/vct_pro_comps.json frontend/public/vct_pro_comps.json

EXPOSE 5000

CMD ["gunicorn", "-c", "gunicorn.conf.py", "api:app"]
