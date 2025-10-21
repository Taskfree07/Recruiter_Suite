# AI Matching Service

This is a Python microservice that uses Sentence Transformers for semantic matching between job descriptions and candidate resumes.

## Features

- **Semantic Similarity**: Uses pre-trained Sentence Transformer models to calculate semantic similarity
- **Skills Matching**: Intelligent skill matching using embeddings
- **Batch Processing**: Match multiple candidates against a job in a single request
- **Fast & Lightweight**: Uses `all-MiniLM-L6-v2` model for speed

## Setup

### Prerequisites
- Python 3.8 or higher
- pip

### Installation

```bash
# Navigate to the ai-matching-service directory
cd ai-matching-service

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Running the Service

```bash
python app.py
```

The service will start on `http://localhost:5001`

## API Endpoints

### 1. Health Check
```
GET /health
```

### 2. Generate Embeddings
```
POST /embed
Body: {
  "text": "string or array of strings"
}
```

### 3. Calculate Similarity
```
POST /similarity
Body: {
  "text1": "job description",
  "text2": "resume text"
}
```

### 4. Match Candidate
```
POST /match-candidate
Body: {
  "job_description": "Full job description text",
  "candidate_resume": "Full resume text",
  "job_skills": ["React", "Node.js", "Python"],
  "candidate_skills": ["React", "JavaScript", "SQL"]
}
```

### 5. Batch Match
```
POST /batch-match
Body: {
  "job_description": "Full job description text",
  "job_skills": ["React", "Node.js"],
  "candidates": [
    {
      "id": "candidate1",
      "resume": "resume text",
      "skills": ["React", "JavaScript"]
    }
  ]
}
```

## Model Information

- **Default Model**: `all-MiniLM-L6-v2`
- **Size**: ~80MB
- **Speed**: Fast
- **Quality**: Good for most use cases

For better accuracy, you can switch to:
- `all-MiniLM-L12-v2` (better quality, slower)
- `all-mpnet-base-v2` (best quality, slowest)

Edit `MODEL_NAME` in `app.py` to change the model.

## Integration with Backend

The Node.js backend communicates with this service via HTTP. The matching service enhances the existing keyword-based matching with semantic AI matching.
