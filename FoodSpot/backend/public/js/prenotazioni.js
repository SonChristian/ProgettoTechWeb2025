window.mostraFormPrenotazione = function(ristorante) {
    document.body.insertAdjacentHTML('beforeend', `
        <div id="prenotazione-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center">
            <div style="background:white;padding:30px;border-radius:10px;max-width:400px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,0.3)">
                <h3 style="margin:0 0 20px;color:#1d3557">Prenota ${ristorante.nome}</h3>
                <div style="margin-bottom:15px;padding:15px;background:#f8f9ff;border-radius:8px">
                    <label style="display:block;margin-bottom:5px;font-weight:500">📍 ${ristorante.indirizzo}</label>
                    <label style="display:block;margin-bottom:5px;font-weight:500;color:#666">🕒 ${ristorante.orario}</label>
                    <label style="display:block;font-weight:bold;color:#e63946">${ristorante.folla}</label>
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:500">Numero persone:</label>
                    <select id="num-persone" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:16px">
                        <option value="1">1 persona</option><option value="2" selected>2 persone</option><option value="4">4 persone</option><option value="6">6 persone</option>
                    </select>
                </div>
                <div style="margin-bottom:20px">
                    <label style="display:block;margin-bottom:5px;font-weight:500">Orario:</label>
                    <input id="orario-prenotazione" type="datetime-local" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:16px"
                        value="${new Date(Date.now() + 86400000).toISOString().slice(0,16)}">
                </div>
                <div style="display:flex;gap:10px">
                    <button id="conferma-btn" style="flex:1;padding:14px;background:#e63946;color:white;border:none;border-radius:6px;cursor:pointer;font-size:16px;font-weight:bold">Conferma</button>
                    <button onclick="chiudiFormPrenotazione()" style="flex:1;padding:14px;background:#ddd;color:#333;border:none;border-radius:6px;cursor:pointer;font-size:16px">Annulla</button>
                </div>
            </div>
        </div>
    `);
    document.getElementById('conferma-btn').onclick = () => confermaPrenotazione(ristorante.nome, ristorante.indirizzo, ristorante.folla);
}

window.confermaPrenotazione = function(nome, indirizzo, folla) {
    const numPersone = document.getElementById('num-persone').value;
    const orario = new Date(document.getElementById('orario-prenotazione').value);
    const dataFormatted = orario.toLocaleDateString('it-IT') + ', ' + orario.toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'});
    
    // SALVA in localStorage
    const prenotazioni = JSON.parse(localStorage.getItem('prenotazioniFoodSpot')) || [];
    prenotazioni.unshift({
        nome, indirizzo, data: dataFormatted, persone: numPersone, folla, stato: 'prenotato'
    });
    localStorage.setItem('prenotazioniFoodSpot', JSON.stringify(prenotazioni));
    
    // Redirect IMMEDIATO a prenotazioni.html
    chiudiFormPrenotazione();
    window.location.href = 'prenotazioni.html';
}

window.chiudiFormPrenotazione = function() {
    const modal = document.getElementById('prenotazione-modal');
    if (modal) modal.remove();
}
