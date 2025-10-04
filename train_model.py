import pandas as pd
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

def train_email_classifier():
    """
    Train an email classification model using TfidfVectorizer and LogisticRegression
    """
    print("Loading data from emails.csv...")
    # Load the dataset
    df = pd.read_csv('emails.csv')
    
    print(f"Loaded {len(df)} emails")
    print(f"Label distribution:\n{df['label'].value_counts()}\n")
    
    # Combine subject and body into a single text field
    df['text'] = df['subject'].fillna('') + ' ' + df['body'].fillna('')
    
    # Prepare features and labels
    X = df['text']
    y = df['label']
    
    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("Vectorizing text with TfidfVectorizer (max 1000 features)...")
    # Create TfidfVectorizer with max 1000 features
    vectorizer = TfidfVectorizer(
        max_features=1000,
        stop_words='english',
        ngram_range=(1, 2),  # Use unigrams and bigrams
        min_df=2  # Ignore terms that appear in less than 2 documents
    )
    
    # Fit and transform training data
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    print("Training LogisticRegression model...")
    # Train Logistic Regression model
    model = LogisticRegression(
        max_iter=1000,
        random_state=42,
        class_weight='balanced'  # Handle imbalanced classes
    )
    model.fit(X_train_vec, y_train)
    
    # Evaluate the model
    y_pred = model.predict(X_test_vec)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\nModel Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save the model and vectorizer
    print("\nSaving model to model.pkl...")
    with open('model.pkl', 'wb') as f:
        pickle.dump(model, f)
    
    print("Saving vectorizer to vectorizer.pkl...")
    with open('vectorizer.pkl', 'wb') as f:
        pickle.dump(vectorizer, f)
    
    print("\n✓ Training complete! Model and vectorizer saved successfully.")
    print(f"✓ Model can predict {len(model.classes_)} classes: {list(model.classes_)}")

if __name__ == '__main__':
    train_email_classifier()
