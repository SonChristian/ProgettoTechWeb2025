document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        // saves token and user's data if login Ok
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user.nome);
        localStorage.setItem('userSurname', data.user.cognome);
        localStorage.setItem('userEmail', data.user.email);

        // redirect to dashboard
        window.location.href = 'dashboard.html';

    } catch (err) {
        console.error(err);
        alert('Error during login');
    }
});