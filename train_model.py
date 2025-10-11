import pandas as pd
import pickle
import argparse
import os
 from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

def train_email_classifier(data_file='emails.csv'):
    """
    Train an email classification model using TfidfVectorizer and LogisticRegression
    
    Args:
        data_file: Path to the CSV file containing training data
    """
    print(f"Loading data from {data_file}...")
    
    # Check if file exists
    if not os.path.exists(data_file):
        print(f"❌ Error: File '{data_file}' not found!")
        print("\n💡 提示:")
        if data_file == 'emails_real.csv':
            print("   请先运行: python prepare_training_data.py")
            print("   来准备真实的Gmail训练数据")
        return False
    
    # Load the dataset
    df = pd.read_csv(data_file)
    
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
    
    return True

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='训练邮件分类模型',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 使用mock数据训练（默认）
  python train_model.py
  
  # 使用真实Gmail数据训练
  python train_model.py --data emails_real.csv
  
  # 使用自定义数据文件
  python train_model.py --data path/to/your/data.csv

注意: 
  - 数据文件必须包含 'subject', 'body', 'label' 三列
  - 使用真实数据前，请先运行: python prepare_training_data.py
        """
    )
    
    parser.add_argument(
        '--data',
        type=str,
        default='emails.csv',
        help='训练数据CSV文件路径 (默认: emails.csv)'
    )
    
    args = parser.parse_args()
    
    print("="*60)
    print("🚀 开始训练邮件分类模型")
    print("="*60)
    print(f"📁 数据文件: {args.data}")
    print()
    
    success = train_email_classifier(args.data)
    
    if success:
        print("\n" + "="*60)
        print("✅ 训练成功！")
        print("="*60)
        print("\n模型文件:")
        print(f"  - model.pkl (分类模型)")
        print(f"  - vectorizer.pkl (文本向量化器)")
        print("\n你现在可以:")
        print("  1. 启动服务测试模型: npm run dev")
        print("  2. 使用Chrome扩展自动分类邮件")
        print("  3. 在后端API中使用分类功能")
    else:
        print("\n❌ 训练失败！请检查上面的错误信息。")
