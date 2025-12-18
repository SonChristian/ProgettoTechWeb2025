const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const userSurname = localStorage.getItem('userSurname');
    const userEmail = localStorage.getItem('userEmail');

    if (!token || !userName || !userSurname || !userEmail) {
        window.location.href = 'login.html';
    }

    // Sidebar: Show First Name + Last Name and Email
    document.getElementById('sidebar-username').innerText = `${userName} ${userSurname}`;
    document.getElementById('sidebar-email').innerText = userEmail;

    // Logout
    document.getElementById('logout').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userSurname');
        localStorage.removeItem('userEmail');
        window.location.href = 'login.html';
    });

    // Cancel reservation (by ID)
    async function annullaPrenotazione(bookingId) {
        if (!confirm('Are you sure you want to cancel this reservation?')) return;

        try {
            const response = await fetch(`/api/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Error during cancellation');
                return;
            }

            alert('Booking cancelled!');
            caricaPrenotazioni();

        } catch (err) {
            console.error(err);
            alert('Error during cancellation');
        }
    }

    // Load reservations from the database
    async function caricaPrenotazioni() {
        try {
            const response = await fetch('/api/bookings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            const prenotazioni = data.bookings || [];
            const container = document.getElementById('lista-prenotazioni');

            if (prenotazioni.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; padding:40px; color:#666;">
                        <span class="fas fa-calendar-plus" style="font-size:48px; margin-bottom:20px; opacity:0.5;"></span>
                        <h3>No booking</h3>
                        <p>Make your first reservation from the Dashboard!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = prenotazioni.map(p => `
                <div class="prenotazione">
                    <div class="info-top">
                        <h3>${p.restaurantName}</h3>
                        <span class="stato prenotato">Reserved</span>
                    </div>
                    <div class="dettagli">
                    <div>
                        <span class="fas fa-calendar"></span>
                            Booking in date: ${formatDateTime(p.createdAt)}
                    </div>
                    <div>
                        <span class="fas fa-users"></span>
                        ${p.numPeople} people
                    </div>
                    </div>

                    <div class="azioni">
                        <button class="btn btn-primary" onclick="annullaPrenotazione('${p._id}')">
                            <span class="fas fa-times"></span> Cancel
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (err) {
            console.error(err);
            alert('Error loading reservations');
        }
    }

    window.addEventListener('load', caricaPrenotazioni);

    function formatDateTime(dateString) {
    const date = new Date(dateString);

    const giorno = date.toLocaleDateString('it-IT');
    const ora = date.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return `${giorno} alle ${ora}`;
}