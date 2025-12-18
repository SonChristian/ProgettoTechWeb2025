document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const cognome = document.getElementById('cognome').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    if (password !== confirmPassword) {
        alert('Password do not match');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, cognome, email, password })
        });

        const result = await response.json();
        alert(result.message);

        if (response.ok) {
            // redirect to login page
            window.location.href = 'login.html';
        }
    } catch (err) {
        console.error(err);
        alert('error while registering');
    }
});