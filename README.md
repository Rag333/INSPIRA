# INSPIRA 🎨

A visionary, AI-powered social platform for creative inspiration. Discover aesthetics, generate AI art, and share your imagination with the world.

## ✨ Features

- **Advanced Explore Feed**: A premium masonry layout with custom Three.js backgrounds and Framer Motion animations.
- **AI Art Generation**: Seamless integration for creating and saving visionary concepts. 
- **Secure Authentication**: Robust local auth with OTP email verification and JWT session management.
- **Dynamic Interactions**: Follow creators, like posts, and receive real-time notifications.
- **Privacy First**: Smart filtering ensures you never see your own posts on the global Explore page.

## 🚀 Tech Stack

- **Frontend**: React, Vite, Framer Motion, Three.js, React Three Fiber, Axios.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Nodemailer.
- **Design**: Modern, glassmorphic UI with custom CSS and a focus on visual excellence.

## 🛠️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance.

### 2. Environment Configuration
Create a `.env` file in the `server` directory:
```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_gmail
EMAIL_PASS=your_app_password
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Create a `.env` file in the `client` directory:
```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Install Dependencies
```bash
# In the root or server directory
cd server && npm install

# In the client directory
cd ../client && npm install
```

### 4. Run the Application
```bash
# Start the backend (from server folder)
npm start

# Start the frontend (from client folder)
npm run dev
```

## 🛡️ Security & Best Practices
- **Strict .gitignore**: Secrets and dependencies are never pushed to the repository.
- **Environment Driven**: All sensitive logic is centralized in `.env` files.
- **Protected Routes**: Secure navigation using authentication middleware.

## 📝 License
This project is for personal exploration and creative development.
