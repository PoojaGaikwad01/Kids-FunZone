// Redirects to the login page if there is no authenticated admin session.
// Included on every admin/*.html page, must load before assets/js/admin.js.
(function () {
    fetch('/api/auth/me', { credentials: 'same-origin' })
        .then((res) => {
            if (!res.ok) {
                window.location.href = '../login.html';
            }
        })
        .catch(() => {
            window.location.href = '../login.html';
        });
})();

function adminLogout() {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
        .finally(() => {
            window.location.href = '../login.html';
        });
}
