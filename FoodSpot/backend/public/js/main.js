// ===== MAIN - Coordina tutto =====
document.addEventListener('DOMContentLoaded', () => {
    aggiornaMarker(); // Default Napoli
    initSearch();
    initGeolocation();
    initPopupEvents();
});

function initPopupEvents() {
    map.on('popupopen', () => {
        document.querySelectorAll('[id^="prenota-"]').forEach((btn, index) => {
            btn.onclick = () => window.mostraFormPrenotazione(ristoranti[index]);
        });
    });
}


function initSearch() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    if (searchBtn) searchBtn.addEventListener('click', () => cercaLuogo(searchInput.value));
    if (searchInput) searchInput.addEventListener('keypress', e => e.key === 'Enter' && cercaLuogo(e.target.value));
}

function initGeolocation() {
    const locateBtn = document.getElementById('locateMeBtn');
    if (locateBtn) locateBtn.addEventListener('click', geolocalizzaUtente);
}