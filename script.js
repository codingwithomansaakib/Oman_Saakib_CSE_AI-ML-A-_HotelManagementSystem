const token = localStorage.getItem("token");
console.log("🔑 Token from localStorage:", token);

if (!token) {
    console.warn("⚠️ No token found! Redirecting to login...");
    window.location.href = "login.html";  // Redirect user if not logged in
}

// Handle Booking Form Submission
document.getElementById("bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!token) return alert("Please login first!");

    const bookingData = {
        roomType: document.getElementById("roomType").value,
        checkIn: document.getElementById("checkIn").value,
        checkOut: document.getElementById("checkOut").value,
        adults: document.getElementById("adults").value,
        children: document.getElementById("children").value,
    };

    try {
        const response = await fetch("http://localhost:5000/book-room", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`  // ✅ Fixed Authorization header
            },
            body: JSON.stringify(bookingData),
        });

        const data = await response.json();
        console.log("📨 Server Response:", data);

        if (!response.ok) {
            throw new Error(data.message || "Booking failed");
        }

        alert(data.message);
        loadBookings();  // Refresh booking list
    } catch (error) {
        console.error("❌ Booking Error:", error);
        alert(error.message);
    }
});

// Load User Bookings
async function loadBookings() {
    if (!token) return alert("Please login first!");

    try {
        const response = await fetch("http://localhost:5000/my-bookings", {
            headers: { "Authorization": `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const bookings = await response.json();
        console.log("📅 Bookings Data:", bookings);

        const bookingList = document.getElementById("bookingList");
        bookingList.innerHTML = bookings.length
            ? bookings.map(b => `<li>${b.roomType} from ${b.checkIn} to ${b.checkOut}</li>`).join("")
            : "<li>No bookings found.</li>";
    } catch (error) {
        console.error("❌ Error loading bookings:", error);
        alert("Failed to load bookings. Please try again.");
    }
}

// Load bookings when page loads
loadBookings();
