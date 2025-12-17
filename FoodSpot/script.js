// Dati ristoranti
const ristoranti = [
    { coords: [40.8520, 14.2620], nome: "Pizzeria Gino Sorbillo", indirizzo: "Via dei Tribunali 32", orario: "12:00-15:00 | 19:00-23:30", folla: "mediamente affollato" },
    { coords: [40.8475, 14.2550], nome: "Trattoria da Nennella", indirizzo: "Vico Lungo Teatro Nuovo 103", orario: "12:30-15:00 | 19:30-23:00", folla: "poco affollato" },
    { coords: [40.8560, 14.2640], nome: "Osteria Paradise", indirizzo: "Via Luca Giordano 31, Vomero", orario: "12:00-15:00 | 19:00-22:30", folla: "poco affollato" },
    { coords: [40.8400, 14.2500], nome: "Intraghesu Pub", indirizzo: "Via Toledo 56", orario: "11:00-01:00", folla: "tanto affollato" },
    { coords: [40.8530, 14.2700], nome: "Pizzeria Starita", indirizzo: "Via Materdei 27/28", orario: "12:30-15:30 | 19:30-23:30", folla: "mediamente affollato" },
    { coords: [40.8450, 14.2600], nome: "50 Kalò", indirizzo: "Piazza Sannazaro 201/B", orario: "12:00-15:00 | 19:30-23:00", folla: "tanto affollato" }
];

// Inizializza mappa
const map = L.map('map').setView([40.8518, 14.2681], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
}).addTo(map);

// Variabile per marker esistenti
let existingMarkers = [];

// Funzione per aggiungere/aggiornare marker filtrati
function aggiornaMarker(targetCoords = null) {
    // Rimuovi marker vecchi
    existingMarkers.forEach(marker => map.removeLayer(marker));
    existingMarkers = [];
    
    let filteredRistoranti = ristoranti;
    
    if (targetCoords) {
        // Filtra ristoranti entro 5km dal target
        filteredRistoranti = ristoranti.filter(r => {
            const distanza = getDistance(targetCoords, r.coords);
            return distanza <= 5; // 5km
        });
    }
    
    // Aggiungi nuovi marker
    filteredRistoranti.forEach((ristorante, index) => {
        const marker = L.marker(ristorante.coords).addTo(map);
        
        const emoji = ristorante.folla === 'poco affollato' ? '🟢' : 
                      ristorante.folla === 'mediamente affollato' ? '🟡' : '🔴';
        
        marker.bindPopup(`
            <div style="min-width: 220px; font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 8px 0; color: #1d3557; font-size: 16px;">${ristorante.nome}</h3>
                <p style="margin: 4px 0; font-size: 13px;"><span style="color:#666;">📍</span> ${ristorante.indirizzo}</p>
                <p style="margin: 4px 0; font-size: 13px;"><span style="color:#666;">🕒</span> ${ristorante.orario}</p>
                <p style="margin: 8px 0 0 0; font-weight: bold; font-size: 14px;">${emoji} ${ristorante.folla}</p>
                <button id="prenota-btn-${index}" style="
                    margin-top: 10px; width: 100%; padding: 8px; background: #e63946; 
                    color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
                    Prenota ora
                </button>
            </div>
        `);
        
        existingMarkers.push(marker);
        
        // Event listener per bottone prenota
        map.on('popupopen', function() {
            const btn = document.getElementById(`prenota-btn-${index}`);
            if (btn) {
                btn.onclick = () => mostraFormPrenotazione(ristorante);
            }
        });
    });
    
    // Aggiungi marker target se specificato
    if (targetCoords) {
        const targetMarker = L.marker(targetCoords).addTo(map)
            .bindPopup('<b>Luogo cercato</b><br>Locali vicini mostrati.')
            .openPopup();
        existingMarkers.push(targetMarker);
    }
}

// Funzione distanza (Haversine)
function getDistance(coords1, coords2) {
    const R = 6371; // km
    const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
    const dLon = (coords2[1] - coords1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coords1[0] * Math.PI / 180) * Math.cos(coords2[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Funzione ricerca
async function cercaLuogo(query) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=it`);
        const data = await response.json();
        
        if (data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            map.setView([lat, lon], 14);
            aggiornaMarker([lat, lon]);
            document.getElementById('search-input').value = data[0].display_name;
        } else {
            alert('Luogo non trovato. Prova con un indirizzo più preciso.');
        }
    } catch (error) {
        alert('Errore nella ricerca. Riprova.');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Inizializza marker default
    aggiornaMarker();
    
    // Barra di ricerca
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) cercaLuogo(query);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) cercaLuogo(query);
        }
    });
});

// Funzione per mostrare il form di prenotazione
function mostraFormPrenotazione(ristorante) {
    const formHTML = `
    <div id="prenotazione-modal" style="
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 2000; display: flex;
        align-items: center; justify-content: center;">
        <div style="
          background: white; padding: 30px; border-radius: 10px;
          max-width: 400px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <h3 style="margin: 0 0 20px 0; color: #1d3557;">Prenota ${ristorante.nome}</h3>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500;">
            📍 ${ristorante.indirizzo}
            </label>
            <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #666;">
              🕒 ${ristorante.orario} | ${ristorante.folla}
            </label>
          </div>
          <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Numero persone:</label>
          <select id="num-persone" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            <option value="1">1 persona</option>
            <option value="2" selected>2 persone</option>
            <option value="3">3 persone</option>
            <option value="4">4 persone</option>
            <option value="5">5 persone</option>
            <option value="6">6 persone</option>
          </select>
          </div>
          <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px;">Orario:</label>
          <input id="orario-prenotazione" type="datetime-local"
            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
            value="${new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,16)}">
          </div>
          <div style="display: flex; gap: 10px;">
            <button onclick="confermaPrenotazione('${ristorante.nome}', '${ristorante.indirizzo}', '${ristorante.folla}')"
              style="flex: 1; padding: 12px; background: #e63946; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
              Conferma
            </button>
            <button onclick="chiudiFormPrenotazione()"
              style="flex: 1; padding: 12px; background: #ddd; color: #333; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
              Annulla
            </button>
          </div>
        </div>
    </div>
    `;
      document.body.insertAdjacentHTML('beforeend', formHTML);
}

// Aggiunge marker per ogni ristorante
ristoranti.forEach((ristorante, index) => {
  const marker = L.marker(ristorante.coords).addTo(map);

  const emoji = ristorante.folla === 'poco affollato' ? '🟢' :
  ristorante.folla === 'mediamente affollato' ? '🟡' : '🔴';

  marker.bindPopup(`
    <div style="min-width: 220px; font-family: Arial, sans-serif;">
      <h3 style="margin: 0 0 8px 0; color: #1d3557; font-size: 16px;">${ristorante.nome}</h3>
      <p style="margin: 4px 0; font-size: 13px;"><span style="color:#666;">📍</span> ${ristorante.indirizzo}</p>
      <p style="margin: 4px 0; font-size: 13px;"><span style="color:#666;">🕒</span> ${ristorante.orario}</p>
      <p style="margin: 8px 0 0 0; font-weight: bold; font-size: 14px;">${emoji} ${ristorante.folla}</p>
      <button id="prenota-btn-${index}" style="
        margin-top: 10px; width: 100%; padding: 8px; background: #e63946;
        color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
        Prenota ora
      </button>
    </div>
  `);

// Gestisce il click sul bottone dopo apertura popup
  map.on('popupopen', function() {
    const btn = document.getElementById(`prenota-btn-${index}`);
    if (btn) {
      btn.onclick = () => mostraFormPrenotazione(ristorante);
    }
  });
});

// Funzioni per il form
function confermaPrenotazione(nome, indirizzo, folla) {
    const numPersone = document.getElementById('num-persone').value;
    const orario = document.getElementById('orario-prenotazione').value;

// Formatta data per visualizzazione
    const dataOra = new Date(orario);
    const dataFormatted = dataOra.toLocaleDateString('it-IT') + ', ' + dataOra.toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'});

// Salva prenotazione in localStorage
    const prenotazioni = JSON.parse(localStorage.getItem('prenotazioniFoodSpot')) || [];
    prenotazioni.unshift({
      nome: nome,
      indirizzo: indirizzo,
      data: dataFormatted,
      persone: numPersone,
      folla: folla,
      stato: 'prenotato'
    });
    localStorage.setItem('prenotazioniFoodSpot', JSON.stringify(prenotazioni));

// Chiudi form e mostra conferma
    chiudiFormPrenotazione();
    alert(`Prenotazione confermata per ${nome}!\nVai su "Le mie prenotazioni" per vederla.`);
}

function chiudiFormPrenotazione() {
    const modal = document.getElementById('prenotazione-modal');
    if (modal) modal.remove();
}

// Event listener per il pulsante "La mia posizione"
document.addEventListener('DOMContentLoaded', function() {
    const locateBtn = document.getElementById('locateMeBtn');
    if (locateBtn) {
      locateBtn.addEventListener('click', geolocalizzaUtente);
    }
});

// Funzione geolocalizzazione con gestione errori
function geolocalizzaUtente() {
    if (!navigator.geolocation) {
    alert('Il tuo browser non supporta la geolocalizzazione');
    return;
}

// Mostra loading sul bottone
const btn = document.getElementById('locateMeBtn');
const originalText = btn.innerHTML;
btn.innerHTML = '<span class="fas fa-spinner fa-spin"></span> Ricerca...';
btn.disabled = true;

// Richiede consenso utente e posizione
navigator.geolocation.getCurrentPosition(
function(position) {
// Successo - Centra mappa sulla posizione utente
    const pos = [position.coords.latitude, position.coords.longitude];
    map.setView(pos, 15); // Zoom più vicino per la zona locale

// Rimuove marker precedente dell'utente (se esiste)
    map.eachLayer(function(layer) {
      if (layer instanceof L.Marker && layer._popup && layer._popup._content.includes('La tua posizione')) {
      map.removeLayer(layer);
    }
  });

// Aggiunge marker della posizione utente
    const userMarker = L.marker(pos)
    .addTo(map)
    .bindPopup(`
    <div style="text-align: center; min-width: 150px;">
        <span class="fas fa-user" style="font-size: 24px; color: #4ECDC4; margin-bottom: 10px;"></span>
        <h4 style="margin: 0 0 10px 0; color: #1d3557;">La tua posizione</h4>
        <p style="margin: 0; font-size: 13px; color: #666;">
        Precisione: ${Math.round(position.coords.accuracy)}m
        </p>
    </div>
    `)
    .openPopup();

// Riabilita bottone
btn.innerHTML = originalText;
btn.disabled = false;

console.log('Posizione utente:', pos);
},
function(error) {
// Errore - Gestione casi d'uso
    btn.innerHTML = originalText;
    btn.disabled = false;

    let messaggio = 'Impossibile ottenere la posizione: ';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            messaggio += 'Permesso negato. Abilita la geolocalizzazione nelle impostazioni del browser.';
            break;
        case error.POSITION_UNAVAILABLE:
            messaggio += 'Posizione non disponibile. Prova con il GPS attivo.';
            break;
        case error.TIMEOUT:
            messaggio += 'Timeout. Riprova.';
        break;
        default:
            messaggio += 'Errore sconosciuto.';
        break;
    }
    alert(messaggio);
},
{
  enableHighAccuracy: true, // Massima precisione GPS
  timeout: 10000, // 10 secondi max
  maximumAge: 300000 // Cache 5 minuti
}
);
}