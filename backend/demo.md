# AI Mentor Chatbot - Live Demo Walkthrough

## Prerequisites

```bash
# Start all services
docker-compose up -d

# Wait for services to be ready
docker-compose logs -f api

# Ingest sample data (if not done)
docker-compose exec api python -m app.chatbot.ingest_csv /data/master_students.csv
```

---

## Demo Flow (5 Steps)

### Step 1: Search Student (Name Ambiguity)

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Find student named John"}'
```

**Expected Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "I found multiple students. Please select one by ID:",
  "intent": "search",
  "tool_called": "search_student",
  "students_found": [
    {"student_id": "STU001", "name": "John Doe", "district": "Dhaka"},
    {"student_id": "STU002", "name": "John Smith", "district": "Chittagong"}
  ],
  "requires_selection": true
}
```

**Key Points:**
- Multiple students found → user must choose
- Session ID returned for continuity
- Never auto-selects when ambiguous

---

### Step 2: Select Student & Predict SGPA

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "STU001"
  }'
```

**Then request SGPA:**
```bash
curl -X POST http://localhost:8000/api/v1/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "What is their predicted SGPA?"
  }'
```

**Expected Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Predicted SGPA for John Doe: 3.45 (Low Risk). Top factor: HSC GPA (impact: 0.28)",
  "intent": "grade",
  "tool_called": "predict_sgpa",
  "result": {
    "student_id": "STU001",
    "student_name": "John Doe",
    "prediction_type": "sgpa",
    "result": {
      "predicted_sgpa": 3.45,
      "risk_level": "Low Risk",
      "contributing_factors": [
        {"feature": "HSC GPA", "value": 4.5, "impact_score": 0.28}
      ]
    }
  }
}
```

---

### Step 3: Missing Data Handling

**Request (with incomplete student):**
```bash
curl -X POST http://localhost:8000/api/v1/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Predict career for STU099"
  }'
```

**Expected Response (if data missing):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "I need some additional information: personality_type, preferred_department",
  "intent": "career",
  "pending_fields": ["personality_type", "preferred_department"],
  "requires_input": true
}
```

**Key Points:**
- System detects missing required fields
- Asks user to provide them
- Does not hallucinate values

---

### Step 4: Career Prediction

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "What career suits this student?"
  }'
```

**Expected Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Recommended career for John Doe: Software Developer (confidence: 78%)",
  "intent": "career",
  "tool_called": "predict_career",
  "result": {
    "student_id": "STU001",
    "prediction_type": "career",
    "result": {
      "predicted_career": "Software Developer",
      "confidence_score": 0.78,
      "alternative_paths": [
        {"career": "AI/ML Engineer", "probability": 0.15}
      ]
    }
  }
}
```

---

### Step 5: Session Reset

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/chat/reset \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Session reset successfully"
}
```

**Key Points:**
- Clears selected student
- Clears pending fields
- Ready for new conversation

---

## Health Check

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "modules": {
    "grade_predictor": {"loaded": true},
    "nine_box_predictor": {"loaded": true},
    "career_predictor": {"loaded": true},
    "subject_predictor": {"loaded": true},
    "chatbot": {"loaded": true}
  }
}
```

---

## Fallback Mode Test

Stop Ollama and verify fallback:

```bash
# Stop Ollama
docker-compose stop ollama

# Send request - should use fallback intent detection
curl -X POST http://localhost:8000/api/v1/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "predict sgpa for John Doe"}'
```

System should still work using rule-based intent detection.

---

## Summary

| Feature | Status |
|---------|--------|
| Name Ambiguity | ✅ Asks for selection |
| Missing Data | ✅ Prompts for input |
| SGPA Prediction | ✅ With contributing factors |
| Career Prediction | ✅ With alternatives |
| Session Management | ✅ Reset works |
| Fallback Mode | ✅ Works without LLM |
