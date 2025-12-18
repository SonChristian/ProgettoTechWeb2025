const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const userSurname = localStorage.getItem('userSurname');
    const userEmail = localStorage.getItem('userEmail');

    if (!token || !userName || !userSurname || !userEmail) {
        window.location.href = 'login.html';
    }

    document.getElementById('user-name').innerText = `${userName} ${userSurname}`;
    document.getElementById('sidebar-username').innerText = `${userName} ${userSurname}`;
    document.getElementById('sidebar-email').innerText = userEmail;

    document.getElementById('logout').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userSurname');
        localStorage.removeItem('userEmail');
        window.location.href = 'login.html';
    });