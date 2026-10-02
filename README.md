# HRMS Lite

A lightweight Human Resource Management System built using the MERN stack. The application provides a simple interface for managing employees, departments, and attendance through a React frontend and Node.js/Express REST API backend connected to MongoDB.

## Tech Stack

### Frontend

* React.js
* Vite
* React Router
* Axios
* Tailwind CSS
* Lucide React
* Recharts

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* CORS
* dotenv

## Features

* Employee Management

  * Add employees
  * View employees
  * Update employee details
  * Delete employees

* Department Management

  * Create and manage departments
  * View department information

* Attendance Management

  * Record attendance
  * View attendance records
  * Manage employee attendance

* Dashboard and Data Visualization

  * HR-related summary information
  * Charts and visualizations using Recharts

* RESTful API

  * React frontend communicates with the Express backend using Axios.

## Project Structure

```text
HRMS-Lite/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── asyncHandler.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Employee.js
│   │   ├── Department.js
│   │   └── Attendance.js
│   ├── routes/
│   │   ├── employeeRoutes.js
│   │   ├── departmentRoutes.js
│   │   └── attendanceRoutes.js
│   ├── seed/
│   │   └── seedData.js
│   ├── utils/
│   │   └── apiError.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB or a MongoDB Atlas account
* Git

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/HRMS-Lite.git
cd HRMS-Lite
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

Do not commit the `.env` file to GitHub.

### 4. Start the backend

For development:

```bash
npm run dev
```

For normal execution:

```bash
npm start
```

The backend runs on the configured port, for example:

```text
http://localhost:5000
```

### 5. Install frontend dependencies

Open another terminal:

```bash
cd client
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

Vite will provide the local development URL, normally:

```text
http://localhost:5173
```

## Build Frontend

To create a production build:

```bash
cd client
npm run build
```

The generated production files are placed inside:

```text
client/dist/
```

The `dist` folder is generated automatically and does not need to be committed to the source repository.

## Seed Database

The backend includes a seed script.

From the `server` directory:

```bash
npm run seed
```

Use this only when you want to populate the database with the project's seed data.

## API

The backend exposes REST APIs for the main HRMS resources:

```text
Employees
Attendance
Departments
```

The React frontend communicates with these APIs using Axios.

## Environment Variables

The application uses environment variables for configuration.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

Keep actual credentials and connection strings private.

## Deployment

The application can be deployed as separate frontend and backend services.

### Frontend

Build the React application:

```bash
cd client
npm install
npm run build
```

Deploy the generated `dist` output using your selected frontend hosting platform.

### Backend

Deploy the `server` directory as a Node.js/Express application and configure the required environment variables on the hosting platform.

### Database

Use MongoDB Atlas or another MongoDB deployment for the production database.

## Git

The repository should contain the source code and configuration files required to install and build the application.

Generated and sensitive files should not be committed:

```text
node_modules/
client/dist/
.env
```

## License

This project is developed as an HRMS Lite application for learning and project demonstration purposes.
