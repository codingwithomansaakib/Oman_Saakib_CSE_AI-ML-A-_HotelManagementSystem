document.addEventListener("DOMContentLoaded", async () => {
    const bookingsList = document.getElementById("bookings-list");
    const errorMessage = document.getElementById("error-message");

    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user._id) {
        errorMessage.style.display = "block";
        errorMessage.textContent = "User not logged in!";
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/my-bookings/${user._id}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.msg || "Failed to fetch bookings");
        }

        const { bookings } = result;

        if (bookings.length === 0) {
            bookingsList.innerHTML = "<p>No bookings found.</p>";
            return;
        }

        bookings.forEach(booking => {
            const bookingItem = document.createElement("div");
            bookingItem.classList.add("booking-item");
            
            bookingItem.innerHTML = `
                <h3>Booking for: ${booking.name}</h3>
                <p><strong>Email:</strong> ${booking.email}</p>
                <p><strong>Room Type:</strong> ${booking.roomType}</p>
                <p><strong>Check-In:</strong> ${new Date(booking.checkIn).toDateString()}</p>
                <p><strong>Check-Out:</strong> ${new Date(booking.checkOut).toDateString()}</p>
                <p><strong>Adults:</strong> ${booking.adults} | <strong>Children:</strong> ${booking.children}</p>
                ${booking.faceImage ? `<img src="${booking.faceImage}" alt="Face Image" style="width:100px; height:100px; border-radius: 50%; margin-top:10px;">` : `<p>No face image available</p>`}
                <hr>
            `;
            bookingsList.appendChild(bookingItem);
        });

    } catch (error) {
        console.error("Error fetching bookings:", error.message);
        errorMessage.style.display = "block";
        errorMessage.textContent = "Error fetching bookings. Please try again.";
    }
});

