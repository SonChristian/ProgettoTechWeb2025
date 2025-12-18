const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

// Select the form fields
const nomeInput = document.querySelector('.settings-section input[type="text"]:nth-of-type(1)');
const cognomeInput = document.querySelector('.settings-section input[type="text"]:nth-of-type(2)');
const emailInput = document.querySelector('.settings-section input[type="email"]');
const passwordInput = document.querySelector('.settings-section input[type="password"]');
const salvaBtn = document.querySelector('.btn-find-restaurant');

// sidebar elements
const sidebarNome = document.getElementById('sidebar-username');
const sidebarEmail = document.getElementById('sidebar-email');

// Load user data
async function caricaDatiUtente() {
    try {
        // Only to validate tokens
        const response = await fetch('/api/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Token non valido');

        // Load data from localStorage
        const nome = localStorage.getItem('userName') || '';
        const cognome = localStorage.getItem('userSurname') || '';
        const email = localStorage.getItem('userEmail') || '';

        nomeInput.value = nome;
        cognomeInput.value = cognome;
        emailInput.value = email;

        // Update sidebar
        sidebarNome.textContent = `${nome} ${cognome}`;
        sidebarEmail.textContent = email;

    } catch (err) {
        console.error(err);
        alert('Error loading user data');
    }
}

// Save changes
salvaBtn.addEventListener('click', async () => {
    const nome = nomeInput.value.trim();
    const cognome = cognomeInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!nome || !cognome || !email) {
        alert('Fill in all required fields!');
        return;
    }

    try {
        const response = await fetch('/api/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                nome, 
                cognome, 
                email, 
                password: password || undefined
            })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Error during update');
            return;
        }

        // Update localStorage
        localStorage.setItem('userName', data.user.nome);
        localStorage.setItem('userSurname', data.user.cognome);
        localStorage.setItem('userEmail', data.user.email);

        // Update sidebar
        sidebarNome.textContent = `${data.user.nome} ${data.user.cognome}`;
        sidebarEmail.textContent = data.user.email;

        alert('Data updated correctly!');
        passwordInput.value = '';
    } catch (err) {
        console.error(err);
        alert('Error during update');
    }
});

// Initialize
caricaDatiUtente();