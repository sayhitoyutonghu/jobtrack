from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os

app = Flask(__name__)
# Enable CORS for Chrome Extension to call the API
CORS(app)

# Load the trained model and vectorizer
MODEL_PATH = 'model.pkl'
VECTORIZER_PATH = 'vectorizer.pkl'

model = None
vectorizer = None

def load_model():
    """Load the trained model and vectorizer"""
    global model, vectorizer
    
    if not os.path.exists(MODEL_PATH):
        # Just print warning, don't crash if model missing for now
        print(f"Warning: Model file not found: {MODEL_PATH}")
        return
    
    if not os.path.exists(VECTORIZER_PATH):
        print(f"Warning: Vectorizer file not found: {VECTORIZER_PATH}")
        return
    
    print("Loading model and vectorizer...")
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    
    with open(VECTORIZER_PATH, 'rb') as f:
        vectorizer = pickle.load(f)
    
    print(f"✓ Model loaded successfully. Can predict classes: {list(model.classes_)}")

# --- New Logic for Email Analysis ---

def classify_email_status(subject, snippet):
    """
    Simple rule-based classification or LLM placeholder.
    """
    subject_lower = subject.lower()
    snippet_lower = snippet.lower()
    
    if "reject" in snippet_lower or "unfortunately" in snippet_lower or "regret" in snippet_lower:
        return "Rejected"
    elif "offer" in subject_lower or "congratulations" in snippet_lower or "offer letter" in snippet_lower:
        return "Offer"
    elif "interview" in subject_lower or "schedule" in snippet_lower or "availability" in snippet_lower:
        return "Interviewing"
    else:
        return "Applied"

@app.route('/api/emails/analyze', methods=['GET'])
def analyze_emails():
    """
    Endpoint to fetch and analyze emails.
    Currently returns mock data as requested.
    """
    # In a real scenario, you would:
    # 1. Authenticate user (check header)
    # 2. Call Gmail API to get recent emails
    # 3. Parse and classify them
    
    # Mock Data simulating real Gmail analysis
    mock_real_data = [
        {
            "id": "real_1",
            "company": "Anthropic",
            "role": "AI Research Engineer",
            "salary": "$250k",
            "status": classify_email_status("Interview Invitation", "We would like to schedule a coding interview.")
        },
        {
            "id": "real_2",
            "company": "OpenAI",
            "role": "Member of Technical Staff",
            "salary": "$300k",
            "status": classify_email_status("Application Update", "Thank you for applying. Unfortunately we will not move forward.")
        },
        {
            "id": "real_3",
            "company": "DeepMind",
            "role": "Research Scientist",
            "salary": "Unknown",
            "status": classify_email_status("Application Received", "We have received your application for Research Scientist.")
        },
        {
            "id": "real_4",
            "company": "Meta",
            "role": "Frontend Engineer",
            "salary": "$190k",
            "status": "Offer" # Explicitly set for demo
        }
    ]
    
    return jsonify(mock_real_data)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'vectorizer_loaded': vectorizer is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict email category"""
    try:
        data = request.get_json()
        if not data: return jsonify({'error': 'No JSON data provided'}), 400
        
        subject = data.get('subject', '')
        body = data.get('body', '')
        
        if not subject and not body: return jsonify({'error': 'Both subject and body are empty'}), 400
        
        if not model or not vectorizer:
            return jsonify({'error': 'Model not loaded'}), 503

        text = f"{subject} {body}"
        text_vectorized = vectorizer.transform([text])
        prediction = model.predict(text_vectorized)[0]
        probabilities = model.predict_proba(text_vectorized)[0]
        
        prob_dict = {label: float(prob) for label, prob in zip(model.classes_, probabilities)}
        confidence = float(max(probabilities))
        
        return jsonify({
            'label': prediction,
            'confidence': confidence,
            'probabilities': prob_dict
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Predict multiple emails at once"""
    try:
        data = request.get_json()
        if not data or 'emails' not in data: return jsonify({'error': 'No emails provided'}), 400
        
        emails = data['emails']
        if not isinstance(emails, list): return jsonify({'error': 'emails must be a list'}), 400
        
        if not model or not vectorizer:
             return jsonify({'error': 'Model not loaded'}), 503

        results = []
        for email in emails:
            subject = email.get('subject', '')
            body = email.get('body', '')
            text = f"{subject} {body}"
            
            text_vectorized = vectorizer.transform([text])
            prediction = model.predict(text_vectorized)[0]
            probabilities = model.predict_proba(text_vectorized)[0]
            confidence = float(max(probabilities))
            
            results.append({
                'label': prediction,
                'confidence': confidence
            })
        
        return jsonify({'predictions': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/categories', methods=['GET'])
def get_categories():
    """Get all available categories"""
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    return jsonify({
        'categories': list(model.classes_)
    })

if __name__ == '__main__':
    # Load model on startup
    try:
        load_model()
    except Exception as e:
        print(f"⚠ Warning: {e}")
    
    # Run Flask app on port 5000
    print("\n" + "="*50)
    print("🚀 Email Classification API Server")
    print("="*50)
    print("Server running on: http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  GET  /health          - Health check")
    print("  GET  /api/emails/analyze - Analyze emails (Mock)")
    print("  GET  /categories      - Get all categories")
    print("  POST /predict         - Predict single email")
    print("  POST /batch_predict   - Predict multiple emails")
    print("\nPress CTRL+C to stop the server")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
