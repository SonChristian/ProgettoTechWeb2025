// mappa.js
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Devi effettuare il login');
        window.location.href = 'login.html';
        return;
    }

    // Centro mappa su Napoli
    const map = L.map('map').setView([40.8518, 14.2681], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // --- Barra di ricerca ---
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-btn');

    searchButton.addEventListener('click', async () => {
        const query = searchInput.value.trim();
        if (!query) return alert('Inserisci una località');

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const results = await response.json();
            if (results.length === 0) return alert('Località non trovata');

            const { lat, lon } = results[0];
            map.setView([parseFloat(lat), parseFloat(lon)], 13);

        } catch (err) {
            console.error(err);
            alert('Errore durante la ricerca della località');
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchButton.click();
    });

    // --- Caricamento ristoranti ---
    async function caricaRistoranti() {
        try {
            const response = await fetch('/api/restaurants');
            const data = await response.json();
            return data.restaurants.filter(r => r.availableSeats > 0) || [];
        } catch (err) {
            console.error('Errore nel recupero ristoranti:', err);
            return [];
        }
    }

    const places = await caricaRistoranti();

    // --- Aggiunta marker con popup ---
    places.forEach(place => {
        const marker = L.marker([place.latitude, place.longitude]).addTo(map);
        const popupContent = `
            <strong>${place.name}</strong><br>
            <em>${place.address}</em><br>
            Orari: ${place.openingHours}<br>
            Posti disponibili: ${place.availableSeats}<br>
            <button class="book-btn" data-id="${place._id}" data-name="${place.name}">Prenota ora</button>
        `;
        marker.bindPopup(popupContent);
    });

    // --- Click su "Prenota ora" ---
    map.on('popupopen', (e) => {
        const button = e.popup._contentNode.querySelector('.book-btn');
        if (button) {
            button.addEventListener('click', () => {
                const restaurantId = button.getAttribute('data-id');
                const restaurantName = button.getAttribute('data-name');
                openBookingModal(restaurantId, restaurantName);
            });
        }
    });

    // --- Modale prenotazione ---
    function openBookingModal(restaurantId, restaurantName) {
        document.getElementById('restaurant-name').innerText = restaurantName;
        const modal = document.getElementById('booking-modal');
        modal.style.display = 'block';

        document.getElementById('close-modal').onclick = () => modal.style.display = 'none';
        document.getElementById('cancel-booking').onclick = () => modal.style.display = 'none';

        document.getElementById('confirm-booking').onclick = async () => {
            const numPeople = parseInt(document.getElementById('num-people').value, 10);
            if (!numPeople || numPeople <= 0) {
                alert('Inserisci un numero valido di persone');
                return;
            }

            try {
                const response = await fetch('/api/book', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ restaurantId, restaurantName, numPeople })
                });

                const data = await response.json();
                if (!response.ok) {
                    alert(data.message || 'Errore durante la prenotazione');
                    return;
                }

                alert(`Prenotazione confermata per ${numPeople} persona/e al ristorante ${restaurantName}`);
                modal.style.display = 'none';
                location.reload(); // Ricarica mappa e marker per aggiornare posti disponibili

            } catch (err) {
                console.error(err);
                alert('Errore durante la prenotazione');
            }
        };
    }

    // Chiudi modale cliccando fuori
    window.onclick = (event) => {
        const modal = document.getElementById('booking-modal');
        if (event.target === modal) modal.style.display = 'none';
    };
});
