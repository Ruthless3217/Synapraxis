FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create a non-root user and group, and give them ownership of /app for SQLite database writes
RUN groupadd -r appgroup && useradd -r -g appgroup -d /app appuser \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Run with uvicorn — reload disabled for production containers
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
