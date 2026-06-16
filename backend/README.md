# AI Mentor SaaS Platform

AI Mentor is an AI-powered student mentoring platform with Machine Learning predictions and an LLM-powered chatbot. It provides predictive analytics for student performance, career paths, and subject choices, while offering an interactive conversational interface that leverages real-time student data.

## Features

- **Grade Predictor (SGPA)**: Predicts a student's next semester GPA based on academic history, study habits, and socioeconomic factors.
- **9-Box Predictor**: Assesses performance and potential to place a student in a 9-box grid (e.g., Star, Core Player, Risk).
- **Career Predictor**: Recommends the best career path based on skills, personality, and academic record.
- **Subject Predictor**: Recommends the best academic department/major based on interests and goals.
- **AI Chatbot**: A conversational agent powered by `Ollama` (phi3:mini) that can answer questions about students by securely invoking ML tools via the Model Context Protocol (MCP) pattern.
- **Admin Ingestion**: Background tasks to ingest large datasets of student CSVs.

## Tech Stack

- **Backend Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: PostgreSQL with `pgvector` for potential vector similarity context.
- **Machine Learning**: CatBoost, scikit-learn for the predictive engines.
- **LLM Engine**: [Ollama](https://ollama.ai/) running locally for privacy-preserving AI inferences.
- **Data Access Layer**: SQLAlchemy (async) and asyncpg.

## Prerequisites

To quickly run the full stack, you only need **Docker** and **Docker Compose**. 

## Running with Docker (Recommended)

The easiest way to get the entire project running—including the database, ML models, and the local LLM server—is via Docker.

```bash
# 1. Start all services in detached mode
docker-compose up -d

# 2. To view the logs of the API to ensure startup completed
docker-compose logs -f api
```

The `docker-compose.yml` automatically:
1. Starts a PostgreSQL database with `pgvector` enabled.
2. Runs the database initialization script (`init.sql`).
3. Starts the Ollama server and pulls the `phi3:mini` model in the background.
4. Starts the FastAPI application on port 8000.

## Local Development (Without Docker)

If you wish to run the FastAPI app directly (e.g., for easier debugging):

1. **Create a virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Run the server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

*(Note: The chatbot requires both PostgreSQL and Ollama to be running on their default ports. You can run those individually via Docker and run the API locally).*

## API Documentation

Once the server is running, the interactive Swagger documentation is available at:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

## Health Checks

- System Health: `GET /health`
- Chatbot Health: `GET /api/v1/chat/health`

## Testing

The project includes an extensive test suite built with `pytest`. To run tests:

```bash
pytest tests/ -v
```
