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

# --- Helper for Mock Data ---
def classify_email_status(subject, snippet):
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

# --- Endpoints ---

@app.route('/auth/status', methods=['GET'])
def auth_status():
    """Mock auth status for frontend compatibility"""
    return jsonify({
        'authenticated': True,
        'sessionId': 'dev-session-id',
        'user': 'demo@example.com'
    })

@app.route('/api/labels', methods=['GET'])
def get_labels():
    """Mock labels for frontend compatibility"""
    return jsonify({
        'success': True,
        'labels': [
            {'id': 'Label_1', 'name': 'JobTrack/Applied', 'type': 'user', 'color': {'backgroundColor': '#4a86e8', 'textColor': '#ffffff'}, 'enabled': True},
            {'id': 'Label_2', 'name': 'JobTrack/Interview', 'type': 'user', 'color': {'backgroundColor': '#e88c30', 'textColor': '#ffffff'}, 'enabled': True},
            {'id': 'Label_3', 'name': 'JobTrack/Offer', 'type': 'user', 'color': {'backgroundColor': '#1e8e3e', 'textColor': '#ffffff'}, 'enabled': True},
            {'id': 'Label_4', 'name': 'JobTrack/Rejected', 'type': 'user', 'color': {'backgroundColor': '#d93025', 'textColor': '#ffffff'}, 'enabled': True}
        ]
    })

@app.route('/api/emails/analyze', methods=['GET'])
def analyze_emails():
    """
    Endpoint to fetch and analyze emails.
    Currently returns mock data as requested.
    """
    mock_real_data = [
        {
            "id": "real_1",
            "company": "Anthropic",
            "role": "AI Research Engineer",
            "salary": "$250k",
            "status": classify_email_status("Interview Invitation", "We would like to schedule a coding interview."),
            "description": "Research role focusing on alignment.",
            "date": "2023-11-01",
            "emailSnippet": "We would like to schedule a coding interview with you next week."
        },
        {
            "id": "real_2",
            "company": "OpenAI",
            "role": "Member of Technical Staff",
            "salary": "$300k",
            "status": classify_email_status("Application Update", "Thank you for applying. Unfortunately we will not move forward."),
            "description": "Core infrastructure team.",
            "date": "2023-10-28",
            "emailSnippet": "Thank you for applying. Unfortunately we will not move forward at this time."
        },
        {
            "id": "real_3",
            "company": "DeepMind",
            "role": "Research Scientist",
            "salary": "Unknown",
            "status": classify_email_status("Application Received", "We have received your application for Research Scientist."),
            "description": "AGI research.",
            "date": "2023-11-05",
            "emailSnippet": "We have received your application for Research Scientist. Our team will review it shortly."
        },
        {
            "id": "real_4",
            "company": "Meta",
            "role": "Frontend Engineer",
            "salary": "$190k",
            "status": "Offer",
            "description": "React core team.",
            "date": "2023-11-10",
            "emailSnippet": "We are pleased to offer you the position of Frontend Engineer at Meta."
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
    
    # Run Flask app on port 5001
    print("\n" + "="*50)
    print("🚀 Email Classification API Server")
    print("="*50)
    print("Server running on: http://localhost:5001")
    print("\nAvailable endpoints:")
    print("  GET  /health          - Health check")
    print("  GET  /auth/status     - Mock Auth Status")
    print("  GET  /api/labels      - Mock Labels")
    print("  GET  /api/emails/analyze - Analyze emails (Mock)")
    print("  GET  /categories      - Get all categories")
    print("  POST /predict         - Predict single email")
    print("  POST /batch_predict   - Predict multiple emails")
    print("\nPress CTRL+C to stop the server")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
