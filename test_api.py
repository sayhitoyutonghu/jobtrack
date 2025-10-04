import requests
import json

# API 基础 URL
BASE_URL = "http://localhost:5000"

def test_health():
    """测试健康检查"""
    print("=" * 50)
    print("测试 1: 健康检查")
    print("=" * 50)
    response = requests.get(f"{BASE_URL}/health")
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}\n")

def test_categories():
    """测试获取分类列表"""
    print("=" * 50)
    print("测试 2: 获取所有分类")
    print("=" * 50)
    response = requests.get(f"{BASE_URL}/categories")
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}\n")

def test_predict():
    """测试单个邮件预测"""
    print("=" * 50)
    print("测试 3: 预测邮件分类")
    print("=" * 50)
    
    # 测试案例 1: 面试邀请
    test_email_1 = {
        "subject": "Interview Invitation",
        "body": "We would like to invite you for an interview next week. Please let us know your availability."
    }
    
    print(f"输入邮件:")
    print(f"  主题: {test_email_1['subject']}")
    print(f"  正文: {test_email_1['body']}")
    
    response = requests.post(f"{BASE_URL}/predict", json=test_email_1)
    print(f"\n状态码: {response.status_code}")
    result = response.json()
    print(f"预测结果: {result['label']}")
    print(f"置信度: {result['confidence']:.2%}")
    print(f"所有概率: {json.dumps(result['probabilities'], indent=2, ensure_ascii=False)}\n")
    
    # 测试案例 2: 录用通知
    test_email_2 = {
        "subject": "Job Offer - Software Engineer",
        "body": "We are pleased to offer you the position of Software Engineer. Salary: $100,000."
    }
    
    print("-" * 50)
    print(f"输入邮件:")
    print(f"  主题: {test_email_2['subject']}")
    print(f"  正文: {test_email_2['body']}")
    
    response = requests.post(f"{BASE_URL}/predict", json=test_email_2)
    result = response.json()
    print(f"\n预测结果: {result['label']}")
    print(f"置信度: {result['confidence']:.2%}\n")
    
    # 测试案例 3: 拒信
    test_email_3 = {
        "subject": "Application Status Update",
        "body": "Thank you for your interest. Unfortunately we have decided to move forward with other candidates."
    }
    
    print("-" * 50)
    print(f"输入邮件:")
    print(f"  主题: {test_email_3['subject']}")
    print(f"  正文: {test_email_3['body']}")
    
    response = requests.post(f"{BASE_URL}/predict", json=test_email_3)
    result = response.json()
    print(f"\n预测结果: {result['label']}")
    print(f"置信度: {result['confidence']:.2%}\n")

def test_batch_predict():
    """测试批量预测"""
    print("=" * 50)
    print("测试 4: 批量预测")
    print("=" * 50)
    
    batch_data = {
        "emails": [
            {
                "subject": "Thank you for your application",
                "body": "We have received your application and will review it."
            },
            {
                "subject": "Interview Scheduled",
                "body": "Your interview is confirmed for Monday at 2 PM."
            },
            {
                "subject": "Exciting Opportunity",
                "body": "Hi, I'm a recruiter and I have an opportunity for you."
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/batch_predict", json=batch_data)
    print(f"状态码: {response.status_code}")
    results = response.json()
    
    for i, prediction in enumerate(results['predictions'], 1):
        print(f"\n邮件 {i}:")
        print(f"  预测: {prediction['label']}")
        print(f"  置信度: {prediction['confidence']:.2%}")

if __name__ == "__main__":
    try:
        print("\n🚀 开始测试 JobTrack API\n")
        
        test_health()
        test_categories()
        test_predict()
        test_batch_predict()
        
        print("\n" + "=" * 50)
        print("✅ 所有测试完成！")
        print("=" * 50)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ 错误: 无法连接到 API 服务器")
        print("请确保运行了: python app.py")
    except Exception as e:
        print(f"\n❌ 错误: {e}")
