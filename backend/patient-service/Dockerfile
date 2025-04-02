FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Initialize and migrate the database
RUN flask db init || true
RUN flask db migrate || true
RUN flask db upgrade || true

# Expose the port for the app
EXPOSE 3001

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:3001", "app:app"]
