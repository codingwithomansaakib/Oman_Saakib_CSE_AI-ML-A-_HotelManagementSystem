# Hotel Management System

## Team Members
- Oman Saakib (Roll No: 2301730004)
- jaideep (Roll No : 2301730025)
- Pawan ( Roll No : 2301730061)
- Rishabh (Roll No : 2301730002)

## Short Project Description
This project is a full-stack Hotel Management System designed to streamline hotel room bookings with modern features like user authentication, profile management, and face recognition before confirming a booking.
It includes:
User Signup & Login with JWT
Admin panel for booking management
Room selection and booking
Face recognition using the user's webcam during booking
User profile picture upload
Booking history display
Email-based OTP verification

## Link to Video Explanation


## Technologies Used
- Frontend:
HTML5, CSS3
JavaScript (Vanilla)
Bootstrap 5 (for responsive UI)
Webcam API (for face capture)
Backend:
Node.js (Runtime)
Express.js (Server Framework)
Mongoose (MongoDB ORM)
MongoDB (Database)
Multer (File Upload)
JWT (Authentication)
Nodemailer (Email/OTP)
Dotenv (Environment config)

## Steps to Run/Execute the Project
1. 1. Clone/Download the Project Folder

git clone <repo-url>
cd hotel-management-system

2. Backend Setup
Open terminal in the Backend directory.

Install dependencies:
npm install
Create a .env file in the root and 
MONGO_URI=mongodb://localhost:27017/Hotelmanagement
JWT_SECRET=your_secret_key
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_email_app_password
PORT=5000
Start the server:
node server.js
3. Frontend Setup
Open index.html in your browser directly OR

Use Live Server in VS Code for best results.
   
