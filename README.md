# JobTrack - Email Categorization Dashboard

A full-stack application for automatically categorizing job-related emails using AI-powered label management.

## 🚀 Features

- **Smart Email Categorization**: Automatically categorize job emails into Application, Interview, Offer, Rejected, and Ghost categories
- **Interactive Dashboard**: Modern React-based dashboard for managing email labels and settings
- **Real-time Updates**: Live updates when toggling labels or editing settings
- **Persistent Storage**: SQLite database for reliable data persistence
- **RESTful API**: Complete backend API for label management
- **Responsive Design**: Works on desktop and mobile devices

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

## 🔮 Future Enhancements

- **Google OAuth Integration**: Real Google authentication
- **Gmail API Integration**: Actual email scanning and labeling
- **Advanced AI Categorization**: Machine learning for better email classification
- **Email Rules Engine**: Custom rules for specific senders/domains
- **Analytics Dashboard**: Email categorization statistics
- **Multi-user Support**: User-specific label configurations

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

