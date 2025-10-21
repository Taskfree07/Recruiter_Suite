from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Load the model (using a lightweight model for faster processing)
# You can switch to 'all-MiniLM-L12-v2' or 'all-mpnet-base-v2' for better accuracy
MODEL_NAME = 'all-MiniLM-L6-v2'
logger.info(f'Loading Sentence Transformer model: {MODEL_NAME}')
model = SentenceTransformer(MODEL_NAME)
logger.info('Model loaded successfully')

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'model': MODEL_NAME
    })

@app.route('/embed', methods=['POST'])
def embed():
    """
    Generate embeddings for text
    Request body:
    {
        "text": "string or array of strings"
    }
    """
    try:
        data = request.json
        text = data.get('text')

        if not text:
            return jsonify({'error': 'Text is required'}), 400

        # Convert single string to list
        if isinstance(text, str):
            text = [text]

        # Generate embeddings
        embeddings = model.encode(text)

        return jsonify({
            'embeddings': embeddings.tolist(),
            'shape': embeddings.shape
        })

    except Exception as e:
        logger.error(f'Error in embed endpoint: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/similarity', methods=['POST'])
def similarity():
    """
    Calculate cosine similarity between two texts
    Request body:
    {
        "text1": "string",
        "text2": "string"
    }
    """
    try:
        data = request.json
        text1 = data.get('text1')
        text2 = data.get('text2')

        if not text1 or not text2:
            return jsonify({'error': 'Both text1 and text2 are required'}), 400

        # Generate embeddings
        embeddings = model.encode([text1, text2])

        # Calculate cosine similarity
        similarity_score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]

        return jsonify({
            'similarity': float(similarity_score),
            'percentage': float(similarity_score * 100)
        })

    except Exception as e:
        logger.error(f'Error in similarity endpoint: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/match-candidate', methods=['POST'])
def match_candidate():
    """
    Match a candidate's resume against a job description
    Request body:
    {
        "job_description": "string",
        "candidate_resume": "string",
        "job_skills": ["skill1", "skill2"],
        "candidate_skills": ["skill1", "skill3"]
    }
    """
    try:
        data = request.json
        job_desc = data.get('job_description', '')
        resume = data.get('candidate_resume', '')
        job_skills = data.get('job_skills', [])
        candidate_skills = data.get('candidate_skills', [])

        if not job_desc or not resume:
            return jsonify({'error': 'job_description and candidate_resume are required'}), 400

        # 1. Overall semantic similarity between job description and resume
        overall_embeddings = model.encode([job_desc, resume])
        overall_similarity = cosine_similarity([overall_embeddings[0]], [overall_embeddings[1]])[0][0]

        # 2. Skills matching using embeddings
        skills_score = 0
        skill_matches = []

        if job_skills and candidate_skills:
            job_skills_emb = model.encode(job_skills)
            candidate_skills_emb = model.encode(candidate_skills)

            # For each job skill, find the best matching candidate skill
            for i, job_skill in enumerate(job_skills):
                similarities = cosine_similarity([job_skills_emb[i]], candidate_skills_emb)[0]
                max_sim_idx = np.argmax(similarities)
                max_sim = similarities[max_sim_idx]

                if max_sim > 0.7:  # Threshold for skill match
                    skill_matches.append({
                        'job_skill': job_skill,
                        'candidate_skill': candidate_skills[max_sim_idx],
                        'similarity': float(max_sim)
                    })

            # Calculate skills score as percentage of matched skills
            if len(job_skills) > 0:
                skills_score = len(skill_matches) / len(job_skills)

        # 3. Calculate weighted overall score
        # 60% semantic similarity + 40% skills match
        weighted_score = (overall_similarity * 0.6) + (skills_score * 0.4)

        return jsonify({
            'overall_similarity': float(overall_similarity),
            'overall_similarity_percentage': float(overall_similarity * 100),
            'skills_match_score': float(skills_score),
            'skills_match_percentage': float(skills_score * 100),
            'matched_skills': skill_matches,
            'matched_skills_count': len(skill_matches),
            'total_required_skills': len(job_skills),
            'weighted_score': float(weighted_score),
            'weighted_score_percentage': float(weighted_score * 100)
        })

    except Exception as e:
        logger.error(f'Error in match-candidate endpoint: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/batch-match', methods=['POST'])
def batch_match():
    """
    Match multiple candidates against a job description
    Request body:
    {
        "job_description": "string",
        "job_skills": ["skill1", "skill2"],
        "candidates": [
            {
                "id": "candidate_id",
                "resume": "resume text",
                "skills": ["skill1", "skill3"]
            },
            ...
        ]
    }
    """
    try:
        data = request.json
        job_desc = data.get('job_description', '')
        job_skills = data.get('job_skills', [])
        candidates = data.get('candidates', [])

        if not job_desc or not candidates:
            return jsonify({'error': 'job_description and candidates are required'}), 400

        results = []

        # Encode job description once
        job_desc_emb = model.encode([job_desc])[0]

        # Encode job skills once
        job_skills_emb = None
        if job_skills:
            job_skills_emb = model.encode(job_skills)

        for candidate in candidates:
            candidate_id = candidate.get('id')
            resume = candidate.get('resume', '')
            candidate_skills = candidate.get('skills', [])

            if not resume:
                continue

            # Calculate semantic similarity
            resume_emb = model.encode([resume])[0]
            overall_similarity = cosine_similarity([job_desc_emb], [resume_emb])[0][0]

            # Calculate skills match
            skills_score = 0
            skill_matches = []

            if job_skills_emb is not None and candidate_skills:
                candidate_skills_emb = model.encode(candidate_skills)

                for i, job_skill in enumerate(job_skills):
                    similarities = cosine_similarity([job_skills_emb[i]], candidate_skills_emb)[0]
                    max_sim_idx = np.argmax(similarities)
                    max_sim = similarities[max_sim_idx]

                    if max_sim > 0.7:
                        skill_matches.append({
                            'job_skill': job_skill,
                            'candidate_skill': candidate_skills[max_sim_idx],
                            'similarity': float(max_sim)
                        })

                if len(job_skills) > 0:
                    skills_score = len(skill_matches) / len(job_skills)

            # Weighted score
            weighted_score = (overall_similarity * 0.6) + (skills_score * 0.4)

            results.append({
                'candidate_id': candidate_id,
                'overall_similarity': float(overall_similarity),
                'skills_match_score': float(skills_score),
                'matched_skills_count': len(skill_matches),
                'weighted_score': float(weighted_score),
                'weighted_score_percentage': float(weighted_score * 100)
            })

        # Sort by weighted score (descending)
        results.sort(key=lambda x: x['weighted_score'], reverse=True)

        return jsonify({
            'total_candidates': len(results),
            'results': results
        })

    except Exception as e:
        logger.error(f'Error in batch-match endpoint: {str(e)}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = 5001  # Different port from Node.js backend
    logger.info(f'Starting AI Matching Service on port {port}')
    app.run(host='0.0.0.0', port=port, debug=False)
