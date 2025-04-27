require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require("nodemailer");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://127.0.0.1:3000" }));

// Ensure the uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log("📁 Created 'uploads/' directory");
}

// Serve static files for uploaded images
app.use('/uploads', express.static(uploadDir));



// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// User Model
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    profilePicture: String,
    phone : String,
    address : String
});
const User = mongoose.model('User', UserSchema);

// Booking Schema
const BookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: String,
    roomType: String,
    checkIn: Date,
    checkOut: Date,
    adults: Number,
    children: Number,
    faceImage: String,
    createdAt: { type: Date, default: Date.now }
});
const Booking = mongoose.model("Booking", BookingSchema);

const otpStore = {}; // Temporary storage for OTPs

// Multer Configuration (for profile picture uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Function to send OTP via email
const sendOTP = async (email, otp) => {
    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        console.log( {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        });
        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is: ${otp}`,
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ OTP sent to:", email);
    } catch (error) {
        console.error("❌ Error sending OTP:", error);
        throw new Error("Failed to send OTP.");
    }
};

// User Signup (Send OTP)
app.post('/signup', async (req, res) => {
    console.log("Received Signup Request:", req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ msg: "All fields are required" });
    }

    try {
        
        let user = await User.findOne({ email:req.body.email });
        if (user) return res.status(400).json({ msg: 'User already exists' });
        user = new User({ name, email, password: await bcrypt.hash(password, 10) });
        await user.save();

        // Generate and send OTP
        const otp = Math.floor(100000 + Math.random() * 900000);
        otpStore[email] = otp;
        await sendOTP(email, otp);

        res.json({ msg: "OTP sent to email. Please verify to complete signup." });
    } catch (err) {
        console.error("❌ Signup Error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Verify OTP and Complete Signup
app.post('/verify-otp', async (req, res) => {
    const { email, otp, password, name } = req.body;

    if (!email || !otp || !password || !name) {
        return res.status(400).json({ msg: "All fields are required" });
    }

    if (otpStore[email] && otpStore[email] == otp) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        delete otpStore[email]; // Remove OTP after successful verification
        res.json({ msg: "Signup successful! You can now login." });
    } else {
        res.status(400).json({ msg: "Invalid OTP" });
    }
});

// User Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Update Profile Picture
app.post('/update-profile-picture', upload.single('profilePicture'), async (req, res) => {
    try {
        console.log("📸 Upload request received:", req.body);
        console.log("🖼️ Uploaded file:", req.file);

        if (!req.file) {
            return res.status(400).json({ msg: "No file uploaded" });
        }

        const  userId  = req.headers['user-id'];   // ✅ Extract userId
        if (!userId) {
            return res.status(400).json({ msg: "User ID is missing. Please log in again." });
        }

        let user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "User not found" });

        user.profilePicture = `/uploads/${req.file.filename}`;
        await user.save();

        res.json({ msg: "Profile picture updated successfully!", profilePicture: user.profilePicture });
    } catch (err) {
        console.error("❌ Error in /update-profile-picture:", err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
});


// Update Profile (Phone & Address)
app.put('/update-profile/:id', async (req, res) => {
    const { name, phone, address } = req.body;
    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.address = address || user.address;

        await user.save();
        res.json({ msg: "Profile updated successfully!", user });
    } catch (err) {
        console.error("❌ Profile Update Error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Create Booking
app.post("/book-room", async (req, res) => {
    try {
        const { userId, name, email, roomType, checkIn, checkOut, adults, children , faceImage } = req.body;

        if (!userId || !name || !email || !roomType || !checkIn || !checkOut || !adults ) {
            return res.status(400).json({ msg: "All fields are required." });
        }

        const newBooking = new Booking({ userId, name, email, roomType, checkIn, checkOut, adults, children , faceImage });
        await newBooking.save();

        res.json({ msg: "✅ Booking saved successfully!" });
    } catch (err) {
        console.error("❌ Booking Error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Get User's Bookings
app.get("/my-bookings/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Fetch user's bookings
        const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });

        res.json({
            username: user.username,
            email: user.email,
            bookings: bookings
        });
    } catch (err) {
        console.error("❌ Error Fetching Bookings:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});


app.get("/api/bookings", async (req, res) => {
    try {
        const bookings = await Booking.find(); // Fetch all bookings
        res.json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Error fetching bookings" });
    }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 TestServer running on port ${PORT}`));

