# JobTrack - Email Categorization Dashboard

A full-stack application for automatically categorizing job-related emails using AI-powered label management.

## 🚀 Features

- **Smart Email Categorization**: Automatically categorize job emails into Application, Interview, Offer, Rejected, and Ghost categories
- **Interactive Dashboard**: Modern React-based dashboard for managing email labels and settings
- **Real-time Updates**: Live updates when toggling labels or editing settings
- **Persistent Storage**: SQLite database for reliable data persistence
- **RESTful API**: Complete backend API for label management
- **Responsive Design**: Works on desktop and mobile devices
- **🆕 Real Gmail Data Training**: Train ML models with your actual Gmail emails for improved accuracy
- **🆕 Automated Training Pipeline**: One-click scripts to export, prepare, and train models

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 19 with Vite
- **Styling**: Custom CSS with modern design
- **Icons**: Lucide React icons
- **HTTP Client**: Axios for API communication
- **State Management**: React hooks (useState, useEffect)

### Backend (Node.js + Express)
- **Framework**: Express.js
- **Database**: SQLite3 with automatic schema initialization
- **Security**: Helmet for security headers, CORS enabled
- **Logging**: Morgan for request logging
- **API**: RESTful endpoints for complete CRUD operations

## 📁 Project Structure

```
jobtrack/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── api/             # API client configuration
│   │   ├── Dashboard.jsx     # Main dashboard component
│   │   ├── App.jsx          # Main application component
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Node.js backend API
│   ├── database/            # Database files and models
│   ├── routes/              # API route handlers
│   │   ├── labels.js        # Label management routes
│   │   ├── auth.js          # Authentication routes
│   │   └── gmail.js         # Gmail integration routes
│   ├── server.js            # Main server file
│   ├── start.js             # Database initialization
│   └── package.json
├── start-dev.bat            # Windows startup script
├── start-dev.sh             # Unix startup script
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Quick Start

#### Option 1: Automated Setup (Recommended)
```bash
# Windows
./start-dev.bat

# Unix/Linux/Mac
chmod +x start-dev.sh
./start-dev.sh
```

#### Option 2: Manual Setup

1. **Install Backend Dependencies**
```bash
cd backend
npm install
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

3. **Start Backend Server**
```bash
cd backend
npm start
```

4. **Start Frontend Development Server**
```bash
cd frontend
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 📡 API Endpoints

### Labels Management
- `GET /api/labels` - Get all labels
- `GET /api/labels/:id` - Get specific label
- `PUT /api/labels/:id` - Update label
- `PUT /api/labels/:id/toggle` - Toggle label enabled status
- `POST /api/labels` - Create new label
- `DELETE /api/labels/:id` - Delete label
- `POST /api/labels/update` - Bulk update labels

### Authentication (Mock)
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/status` - Check authentication status
- `POST /auth/logout` - Logout user

### Gmail Integration (Mock)
- `POST /api/gmail/setup` - Setup Gmail labels
- `POST /api/gmail/scan` - Scan emails
- `GET /api/gmail/labels` - Get Gmail labels

## 🎯 Default Categories

The system comes with 5 pre-configured email categories:

1. **Application** 📄 - Job applications and alerts
2. **Interview** 🗓️ - Interview invitations and scheduling
3. **Offer** 💰 - Job offers and compensation
4. **Rejected** ❌ - Rejection notifications
5. **Ghost** 👻 - Companies that stopped responding

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Database

The SQLite database is automatically created at `backend/database/jobtrack.db` with the following tables:
- `labels` - Email categorization labels
- `users` - User authentication data
- `email_rules` - Custom email filtering rules

## 🚀 Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite development server with HMR
```

### Building for Production
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

## 🧪 Testing

Test the API endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Get all labels
curl http://localhost:3000/api/labels

# Toggle a label
curl -X PUT http://localhost:3000/api/labels/1/toggle \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

## 🐳 Docker部署

### 快速开始（一键启动）

**Windows:**
```bash
docker-start.bat
```

**Linux/Mac:**
```bash
chmod +x docker-start.sh
./docker-start.sh
```

### 手动启动

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 访问地址

- **前端**: http://localhost
- **后端API**: http://localhost:3000
- **Python ML**: http://localhost:5000

### Docker文档

- 📖 [Docker部署快速指南.md](./Docker部署快速指南.md) - 中文快速开始
- 📖 [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) - 完整Docker指南

---

## 🤖 Machine Learning Training

### Train with Real Gmail Data

JobTrack now supports training ML models with your actual Gmail emails for improved accuracy!

#### Quick Start (One Command)

**Windows:**
```powershell
.\train_with_gmail.ps1
```

**Linux/Mac:**
```bash
chmod +x train_with_gmail.sh
./train_with_gmail.sh
```

#### Manual Training

```bash
# 1. Export Gmail data
$env:JOBTRACK_SESSION_ID='your_session_id'
node scripts/export-gmail-training-data.js --query "in:inbox" --maxResults 500

# 2. Prepare training data
python prepare_training_data.py

# 3. Train model
python train_model.py --data emails_real.csv
```

#### Documentation

- 📖 [使用真实数据训练_快速开始.md](./使用真实数据训练_快速开始.md) - Quick start guide (Chinese)
- 📖 [TRAIN_WITH_REAL_GMAIL_DATA.md](./TRAIN_WITH_REAL_GMAIL_DATA.md) - Complete training guide
- 📖 [QUICK_TRAIN_REFERENCE.md](./QUICK_TRAIN_REFERENCE.md) - Command reference
- 📖 [TRAINING_SUMMARY.md](./TRAINING_SUMMARY.md) - Current model status

#### Current Performance
- ✅ **Training Data**: 302 real Gmail emails
- ✅ **Model Accuracy**: 98.36%
- 📊 **Categories**: Application, Interview, Offer

## 🔮 Future Enhancements

- **Advanced AI Categorization**: More sophisticated ML models
- **Email Rules Engine**: Custom rules for specific senders/domains
- **Analytics Dashboard**: Email categorization statistics
- **Multi-user Support**: User-specific label configurations
- **Incremental Learning**: Continuous model improvement

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🆘 Support

For issues and questions:
1. Check the API health endpoint
2. Verify database initialization
3. Check browser console for frontend errors
4. Review backend logs for API errors

---

**JobTrack** - Making job search email management effortless! 🎯

