# EventX - Online Event Registration System

[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-v4.4+-darkgreen.svg)](https://www.mongodb.com)
[![Express](https://img.shields.io/badge/Express-v4.17+-blue.svg)](https://expressjs.com)
[![JWT](https://img.shields.io/badge/JWT-Authentication-red.svg)](https://jwt.io)

A robust event registration system built with Node.js, Express, and MongoDB. This system provides comprehensive event management capabilities with secure user authentication, role-based access control, and real-time analytics.

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin/User)
- Secure password hashing
- Token refresh mechanism

### Event Management
- Create, read, update, and delete events
- Event categorization
- Seat capacity management
- Event status tracking
- Image upload support

### Registration System
- Event registration with validation
- Registration status tracking
- Capacity management
- Automated waitlist
- Registration analytics

### Admin Features
- Dashboard with analytics
- User management
- Event oversight
- Registration management
- Category management

### Security Features
- Input validation
- XSS protection
- CORS configuration
- Error handling
- Secure headers

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt, helmet, cors
- **Validation**: Express-validator

## 🏗️ Architecture

The application follows the MVC (Model-View-Controller) pattern with a clear separation of concerns:

```
server/
├── config/             # Configuration files
├── controllers/        # Request handlers
├── middleware/         # Custom middleware
├── models/            # Database models
├── routes/            # API routes
└── utils/             # Utility functions
```

## 🚦 API Endpoints

### Authentication Routes
\`\`\`
POST /api/auth/register   - Register a new user
POST /api/auth/login      - User login
POST /api/auth/refresh    - Refresh access token
\`\`\`

### Event Routes
\`\`\`
GET    /api/events          - Get all events
POST   /api/events          - Create new event (Admin)
GET    /api/events/:id      - Get event details
PUT    /api/events/:id      - Update event (Admin)
DELETE /api/events/:id      - Delete event (Admin)
\`\`\`

### Registration Routes
\`\`\`
POST   /api/registrations/:eventId    - Register for event
GET    /api/registrations/mine        - Get user's registrations
PUT    /api/registrations/:id/cancel  - Cancel registration
GET    /api/registrations/event/:id   - Get event registrations (Admin)
\`\`\`

### Admin Routes
\`\`\`
GET    /api/dashboard/stats     - Get system statistics
GET    /api/dashboard/users     - Get all users
PUT    /api/dashboard/user/:id  - Update user role
\`\`\`

## 🔧 Setup and Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/eventx.git
   cd eventx
   ```

2. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the server directory:
   ```env
   NODE_ENV=development
   PORT=4000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

## 🔑 Environment Variables

| Variable    | Description                | Default     |
|------------|----------------------------|-------------|
| NODE_ENV   | Environment mode           | development |
| PORT       | Server port                | 4000        |
| MONGO_URI  | MongoDB connection string  | -           |
| JWT_SECRET | JWT signing secret         | -           |
| JWT_EXPIRE | JWT expiration time        | 30d         |

## 🛡️ Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Error handling middleware
- CORS protection
- XSS prevention
- Rate limiting

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📈 Future Improvements

- [ ] Add email verification
- [ ] Implement payment gateway integration
- [ ] Add real-time notifications
- [ ] Implement event reminders
- [ ] Add social login options

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

Your Name
- GitHub: [@yourusername](https://github.com/SourajeetOfficial)
- LinkedIn: [Your LinkedIn](https://www.linkedin.com/in/sourajeet-sahoo-29743025b/)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.