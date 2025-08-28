# Full Stack Chat Model

A full-stack chat-bot application with OpenAI integration, featuring user authentication, real-time chat, and file upload capabilities.

## Project Structure

```
├── backend/           # Node.js backend API
│   ├── config/        # Configuration files
│   ├── controller/    # Route controllers
│   ├── middleware/    # Express middleware
│   ├── models/        # MongoDB models
│   ├── routes/        # API routes
│   ├── services/      # Business logic services
│   └── views/         # View templates
```

## Quick Start

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Create and configure your .env file
   npm run dev
   ```

2. **Environment Variables**
   - Copy `.env.example` to `.env` in the backend directory
   - Configure your MongoDB URI and OpenAI API key
   - Set secure JWT secrets

3. **Database**
   - Ensure MongoDB is running
   - The app will automatically create the database and collections

## Features

- 🔐 **Authentication**: JWT-based user registration and login
- 💬 **Chat**: OpenAI-powered conversational AI
- 📁 **File Upload**: Support for image and document uploads
- 🚀 **Real-time**: WebSocket-based real-time communication
- 🛡️ **Security**: Rate limiting, CORS, and input validation

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **AI**: OpenAI GPT API
- **Authentication**: JWT, bcrypt
- **File Processing**: Multer, Sharp
- **Security**: Helmet, CORS, Rate Limiting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License
