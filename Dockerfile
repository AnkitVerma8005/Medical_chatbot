FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HOME=/home/appuser \
    HF_HOME=/home/appuser/.cache/huggingface

WORKDIR /app

RUN useradd --create-home --shell /usr/sbin/nologin appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY src ./src
COPY templates ./templates
COPY static ./static

USER appuser

EXPOSE 8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--worker-class", "gthread", "--threads", "4", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "app:app"]