# SmartStay - Intelligent Accommodation Finder

A full-stack MERN web application that helps students and working professionals find affordable rooms near their workplace or college using AI-powered recommendations.

## Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **Maps:** Google Maps API, OpenStreetMap

## Features

- AI-based room recommendations with stress classification (Low / Medium / High)
- Distance and travel time calculation from workplace to room
- Budget filter (₹7,500 – ₹10,000)
- City-based search across Bangalore, Mumbai, Pune, Delhi, Hyderabad, Chennai
- Owner dashboard with room management (Add / Edit / Delete)
- Contact owner via Email
- Schedule visit requests
- JWT-based login and registration (Student / Owner)
- Responsive Airbnb-style UI

## Project Structure

```
smart system/
├── backend/
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── middleware/      # JWT auth middleware
│   ├── uploads/        # Room images
│   └── server.js       # Express server
└── frontend/
    └── src/
        ├── pages/      # React pages
        ├── components/ # Reusable components
        ├── context/    # Auth context
        └── api/        # Axios config
```

## How to Run

### Prerequisites
- Node.js
- MongoDB (running locally)

### Steps

1. **Load sample data**
```
cd backend
node loadSampleData.js
```

2. **Start backend**
```
cd backend
node server.js
```

3. **Start frontend**
```
cd frontend
npm start
```

4. Open browser at `http://localhost:3000`

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | amit@user.com | password123 |
| Owner | rahul@owner.com | password123 |
