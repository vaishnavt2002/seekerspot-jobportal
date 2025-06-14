FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create directories for static and media files
RUN mkdir -p /app/staticfiles /app/media /app/logs

# Collect static files (this will be overridden by docker-compose command)
RUN python manage.py collectstatic --noinput || true

# Expose port
EXPOSE 8000

# Default command (will be overridden by docker-compose)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]