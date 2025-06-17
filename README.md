# Job Portal Platform

A full-stack job portal application designed to connect job seekers with job providers. The platform allows job seekers to browse and apply for jobs, job providers to post job offers, and facilitates scheduling audio and video interviews directly within the platform.

## Features

### Job Seeker Features:
- Browse and search for job listings
- Apply for jobs with resume uploads
- Schedule audio/video interviews with recruiters
- Application status tracking
- Community chat features

### Job Provider Features:
- Post and manage job offers
- Review applications and candidate profiles
- Schedule and conduct audio/video interviews
- Application management dashboard

### Interview Scheduling:
- Integrated audio and video call functionality for interviews
- Real-time notifications for interview scheduling


## Tech Stack

### Frontend:
- React.js
- Tailwind CSS
- Socket.io Client
- WebRTC

### Backend:
- Python Django
- Django Channels (for WebSocket support)
- Daphne (ASGI server for async features)
- Django REST Framework

### Database:
- PostgreSQL

### Caching & Message Broker:
- Redis (for Django Channels)

### Real-time Communication:
- WebRTC for audio/video calls
- Socket.io for real-time messaging
- Django Channels for WebSocket connections

### Authentication:
- JWT (JSON Web Tokens)

## Prerequisites

Before running this application, make sure you have the following installed:

- Python 3.8 or higher
- Node.js 16 or higher
- PostgreSQL
- Redis Server
- Git

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd seekerspot-jobportal
```

### 2. Backend Setup

#### Create Virtual Environment
```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Database Setup
1. Create a PostgreSQL database:
```sql
CREATE DATABASE job_portal;
CREATE USER job_admin WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE job_portal TO job_admin;
```

2. Create `.env` file in the backend directory:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database Configuration
DB_NAME=job_portal
DB_USER=job_admin
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password


#### Start Redis Server
```bash
# On Windows (if installed via installer)
redis-server

# On macOS (via Homebrew)
brew services start redis

# On Linux (via systemd)
sudo systemctl start redis-server
```

#### Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

#### Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

#### Start Backend Server with Daphne
```bash
# Start with Daphne (required for WebSocket functionality)
daphne -b 0.0.0.0 -p 8000 job_portal.asgi:application --reload
```

**Note**: You must use Daphne server locally as Django's development server doesn't fully support WebSocket connections required for real-time features.

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd frontend
```

#### Install Dependencies
```bash
npm install
```

#### Create Environment File
Create `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

#### Start Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`



## Development

### Running Services

1. **Start Redis Server**:
```bash
redis-server
```

2. **Start Django Backend with Daphne**:
```bash
cd backend
daphne -b 0.0.0.0 -p 8000 backend.asgi:application --reload
```

3. **Start React Frontend**:
```bash
cd frontend
npm run dev
```

