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
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}. Please run train_model.py first.")
    
    if not os.path.exists(VECTORIZER_PATH):
        raise FileNotFoundError(f"Vectorizer file not found: {VECTORIZER_PATH}. Please run train_model.py first.")
    
    print("Loading model and vectorizer...")
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    
    with open(VECTORIZER_PATH, 'rb') as f:
        vectorizer = pickle.load(f)
    
    print(f"✓ Model loaded successfully. Can predict classes: {list(model.classes_)}")

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
    """
    Predict email category
    
    Expected JSON payload:
    {
        "subject": "Email subject",
        "body": "Email body content"
    }
    
    Returns:
    {
        "label": "predicted_category",
        "confidence": 0.95,
        "probabilities": {
            "category1": 0.95,
            "category2": 0.03,
            ...
        }
    }
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Extract subject and body
        subject = data.get('subject', '')
        body = data.get('body', '')
        
        if not subject and not body:
            return jsonify({'error': 'Both subject and body are empty'}), 400
        
        # Combine subject and body
        text = f"{subject} {body}"
        
        # Vectorize the text
        text_vectorized = vectorizer.transform([text])
        
        # Make prediction
        prediction = model.predict(text_vectorized)[0]
        
        # Get prediction probabilities
        probabilities = model.predict_proba(text_vectorized)[0]
        
        # Create probability dictionary
        prob_dict = {
            label: float(prob) 
            for label, prob in zip(model.classes_, probabilities)
        }
        
        # Get confidence (max probability)
        confidence = float(max(probabilities))
        
        # Return prediction result
        return jsonify({
            'label': prediction,
            'confidence': confidence,
            'probabilities': prob_dict
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """
    Predict multiple emails at once
    
    Expected JSON payload:
    {
        "emails": [
            {"subject": "...", "body": "..."},
            {"subject": "...", "body": "..."}
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'emails' not in data:
            return jsonify({'error': 'No emails provided'}), 400
        
        emails = data['emails']
        
        if not isinstance(emails, list):
            return jsonify({'error': 'emails must be a list'}), 400
        
        results = []
        
        for email in emails:
            subject = email.get('subject', '')
            body = email.get('body', '')
            text = f"{subject} {body}"
            
            # Vectorize and predict
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
    except FileNotFoundError as e:
        print(f"⚠ Warning: {e}")
        print("Please run 'python train_model.py' first to train the model.")
        exit(1)
    
    # Run Flask app on port 5000
    print("\n" + "="*50)
    print("🚀 Email Classification API Server")
    print("="*50)
    print("Server running on: http://localhost:5001")
    print("\nAvailable endpoints:")
    print("  GET  /health          - Health check")
    print("  GET  /categories      - Get all categories")
    print("  POST /predict         - Predict single email")
    print("  POST /batch_predict   - Predict multiple emails")
    print("\nPress CTRL+C to stop the server")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
