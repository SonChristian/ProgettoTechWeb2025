// Select the button
const eliminaBtn = document.querySelector('.btn-outline');

eliminaBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete your account? This action is irreversible!')) {
        return;
    }

    try {
        const response = await fetch('/api/user', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Error deleting account');
            return;
        }

        alert('Account successfully deleted!');
        // Cleaning localStorage
        localStorage.clear();
        // Redirect to login
        window.location.href = 'login.html';

    } catch (err) {
        console.error(err);
        alert('Error deleting account');
    }
});