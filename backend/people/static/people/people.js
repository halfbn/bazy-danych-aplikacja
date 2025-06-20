// Wyświetlanie wszystkich tabel
document.addEventListener('DOMContentLoaded', function() {
    // --- LOGIN MODULE ---
    function isLoggedIn() {
        return localStorage.getItem('loggedIn') === 'true';
    }

    function showLoginPage() {
        if (window.location.pathname !== '/login/') {
            window.location.replace('/login/');
        }
    }

    function showMainPage() {
        if (window.location.pathname === '/login/') {
            window.location.replace('/');
        }
    }

    // If on login page, handle login logic
    if (window.location.pathname === '/login/') {
        const tryLogin = () => {
            const user = document.getElementById('login-username')?.value;
            const pass = document.getElementById('login-password')?.value;
            let users = JSON.parse(localStorage.getItem('appUsers') || '{}');
            const errorDiv = document.getElementById('login-error');

            // Jeśli nie ma żadnych użytkowników, pozwól tylko na admin/pass
            if (Object.keys(users).length === 0) {
                if (user === 'admin' && pass === 'pass') {
                    localStorage.setItem('loggedIn', 'true');
                    localStorage.setItem('appUser', user);
                    currentAppUser = user;
                    users[user] = pass;
                    localStorage.setItem('appUsers', JSON.stringify(users));
                    window.location.replace('/');
                } else {
                    errorDiv.classList.remove('hidden');
                }
                return;
            }
            // Jeśli są już użytkownicy, sprawdź czy login i hasło się zgadzają
            if (users[user] && users[user] === pass) {
                localStorage.setItem('loggedIn', 'true');
                localStorage.setItem('appUser', user);
                currentAppUser = user;
                window.location.replace('/');
            } else {
                errorDiv.classList.remove('hidden');
            }
        };
        document.getElementById('login-btn')?.addEventListener('click', tryLogin);
        document.getElementById('login-password')?.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') tryLogin();
        });
        // If already logged in, skip login
        if (isLoggedIn()) {
            showMainPage();
        }
        return;
    }

    // If not logged in, redirect to login
    if (!isLoggedIn()) {
        showLoginPage();
        return;
    }

    // --- END LOGIN MODULE ---

    // Funkcja generująca główne menu
    function renderMainMenu() {
        const mainPanel = document.getElementById('main-panel');
        if (!mainPanel) return;
        mainPanel.innerHTML = `
            <div class="flex flex-col gap-3">
                <button id="users-btn" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Użytkownicy</button>
                <button id="rooms-btn" class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Pokoje</button>
                <button id="reservations-btn" class="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Rezerwacje</button>
                <button id="permissions-btn" class="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Uprawnienia</button>
                <button id="account-btn" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors mt-16">Konto</button>
                <button id="logout-btn" class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Wyloguj</button>
            </div>
        `;
        document.getElementById('users-btn').onclick = showUsersPanel;
        document.getElementById('rooms-btn').onclick = showRoomsPanel;
        document.getElementById('reservations-btn').onclick = showReservationsPanel;
        document.getElementById('permissions-btn').onclick = showPermissionsPanel;
        document.getElementById('account-btn').onclick = showAccountPanel;
        document.getElementById('logout-btn').onclick = function() {
            localStorage.removeItem('loggedIn');
            localStorage.removeItem('appUser');
            currentAppUser = null;
            renderCurrentUser();
            window.location.replace('/login/');
        };
    }

    // Wywołaj menu po zalogowaniu
    renderMainMenu();

    // Dodaj przycisk widok tabel z boku (nie w głównych)
    let tableViewBtn = document.getElementById('table-view-btn');
    if (!tableViewBtn) {
        const btn = document.createElement('button');
        btn.id = 'table-view-btn';
        btn.textContent = 'Widok tabel';
        btn.className = 'fixed top-2.5 right-2.5 z-[1000] bg-gray-200 hover:bg-gray-300 border border-gray-400 py-2 px-4 rounded-md shadow-md transition-colors';
        document.body.appendChild(btn);
        tableViewBtn = btn;
    }
    tableViewBtn.onclick = showTableViewPanel;

    function showUsersPanel() {
        const mainPanel = document.getElementById('main-panel');
        if (!mainPanel) return;
        mainPanel.innerHTML = `
            <div id="users-menu" class="flex flex-col md:flex-row flex-wrap gap-3 mb-6 justify-center">
                <button id="add-user-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Dodaj użytkownika</button>
                <button id="delete-user-btn" class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Usuń użytkownika</button>
                <button id="change-access-btn" class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Zmień uprawnienia</button>
                <button id="cancel-users-btn" class="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Anuluj</button>
            </div>
            <div id="users-action-panel" class="bg-gray-50 p-4 rounded-lg border"></div>
            <div id="users-table-panel" class="mt-6"></div>
        `;
        document.getElementById('add-user-btn').onclick = showAddUserForm;
        document.getElementById('delete-user-btn').onclick = showDeleteUserForm;
        document.getElementById('change-access-btn').onclick = showChangeAccessForm;
        document.getElementById('cancel-users-btn').onclick = () => window.location.reload();
        renderUsersTable();
    }

    function showAddUserForm() {
        const panel = document.getElementById('users-action-panel');
        panel.innerHTML = '<p>Ładowanie grup...</p>';
        fetch('/api/users/list/')
            .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
            .then(data => {
                const groups = data.groups || [];
                let groupOptions = groups.map(g => {
                    const id = g.AccessGroupID || g.id || g.ID || '';
                    const name = g.GroupName || g.name || g.Name || '';
                    return `<option value="${id}">${name} (#${id})</option>`;
                }).join('');

                panel.innerHTML = `
                    <form id="add-user-form" class="flex flex-wrap items-center gap-3">
                        <input type="text" id="add-user-name" placeholder="Imię" required class="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <input type="text" id="add-user-surname" placeholder="Nazwisko" required class="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <select id="add-user-group" required class="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">${groupOptions}</select>
                        <button type="submit" class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors">Utwórz</button>
                    </form>
                    <div id="add-user-msg" class="p-2 mt-3 rounded hidden"></div>
                `;
                document.getElementById('add-user-form').onsubmit = function(e) {
                    e.preventDefault();
                    const name = document.getElementById('add-user-name').value.trim();
                    const surname = document.getElementById('add-user-surname').value.trim();
                    let access_group_id = document.getElementById('add-user-group').value;
                    const msgDiv = document.getElementById('add-user-msg');
                    
                    if (!name || !surname || !access_group_id) {
                        msgDiv.textContent = 'Wszystkie pola są wymagane!';
                        msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                        return;
                    }
                    fetch('/api/users/add/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, surname, access_group_id })
                    })
                    .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
                    .then(data => {
                        if (data.success) {
                            msgDiv.textContent = 'Dodano użytkownika';
                            msgDiv.className = 'p-2 mt-3 rounded bg-green-100 border border-green-400 text-green-700';
                            renderUsersTable();
                        } else {
                            msgDiv.textContent = 'Błąd: ' + (data.error || 'nieznany');
                            msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                        }
                    });
                };
            });
    }

    function showDeleteUserForm() {
        const panel = document.getElementById('users-action-panel');
        panel.innerHTML = `
            <form id="delete-user-form" class="flex flex-wrap items-center gap-3">
                <input type="number" id="delete-user-id" placeholder="ID użytkownika do usunięcia" required class="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
                <button type="submit" class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors">Usuń</button>
            </form>
            <div id="delete-user-msg" class="p-2 mt-3 rounded hidden"></div>
        `;
        document.getElementById('delete-user-form').onsubmit = async function(e) {
            e.preventDefault();
            const user_id = document.getElementById('delete-user-id').value;
            const msgDiv = document.getElementById('delete-user-msg');
            msgDiv.classList.add('hidden'); // Używamy klas Tailwind
            if (!user_id) return;

            if (!confirm('Czy na pewno chcesz usunąć użytkownika o ID ' + user_id + '?')) return;

            try {
                const response = await fetch('/api/users/delete/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id })
                });

                // Spróbuj sparsować odpowiedź JSON, nawet jeśli jest to błąd
                let data = null;
                try {
                    data = await response.json();
                } catch (err) {
                    // Ciało odpowiedzi mogło być puste lub nie być JSONem
                }

                if (response.ok && data && data.success) {
                    msgDiv.textContent = 'Użytkownik usunięty';
                    msgDiv.className = 'p-2 mt-3 rounded bg-green-100 border border-green-400 text-green-700';
                    renderUsersTable();
                } else {
                    // Wyświetl błąd z serwera lub domyślny komunikat
                    const errorMessage = data?.error || 'Użytkownik o podanym ID nie istnieje lub wystąpił inny błąd.';
                    msgDiv.textContent = 'Błąd: ' + errorMessage;
                    msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                }
            } catch (err) {
                // Ten blok obsłuży faktyczne błędy sieciowe
                msgDiv.textContent = 'Błąd sieci: ' + err.message;
                msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
            }
        };
    }

    function showChangeAccessForm() {
        const panel = document.getElementById('users-action-panel');
        panel.innerHTML = '<p>Ładowanie danych...</p>';
        fetch('/api/users/list/')
            .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
            .then(data => {
                const users = data.users || [];
                const groups = data.groups || [];
                let userOptions = users.map(u => `<option value="${u.UserID}">${u.Name} ${u.Surname} (#${u.UserID})</option>`).join('');
                let groupCheckboxes = groups.map(g => {
                    const id = g.AccessGroupID || g.id || g.ID || '';
                    const name = g.GroupName || g.name || g.Name || '';
                    return `<label class="block"><input type="checkbox" name="change-access-group" value="${id}" class="mr-2">${name} (#${id})</label>`;
                }).join('');

                panel.innerHTML = `
                    <form id="change-access-form">
                        <select id="change-access-user" required class="block w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">${userOptions}</select>
                        <div id="change-access-groups" class="my-2 space-y-1">${groupCheckboxes}</div>
                        <button type="submit" class="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors">Zmień uprawnienia</button>
                    </form>
                    <div id="change-access-msg" class="p-2 mt-3 rounded hidden"></div>
                `;
                document.getElementById('change-access-form').onsubmit = function(e) {
                    e.preventDefault();
                    const user_id = document.getElementById('change-access-user').value;
                    const access_group_ids = Array.from(document.querySelectorAll('input[name="change-access-group"]:checked')).map(cb => cb.value);
                    const msgDiv = document.getElementById('change-access-msg');
                    
                    if (!user_id || !access_group_ids.length) {
                        msgDiv.textContent = 'Wybierz użytkownika i co najmniej jedną grupę!';
                        msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                        return;
                    }
                    
                    fetch('/api/users/change_access/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id, access_group_ids })
                    })
                    .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
                    .then(data => {
                        if (data.success) {
                            msgDiv.textContent = 'Zmieniono uprawnienia użytkownika';
                            msgDiv.className = 'p-2 mt-3 rounded bg-green-100 border border-green-400 text-green-700';
                            renderUsersTable();
                        } else {
                            msgDiv.textContent = 'Błąd: ' + (data.error || 'nieznany');
                            msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                        }
                    })
                    .catch(err => {
                        msgDiv.textContent = 'Błąd sieci: ' + err;
                        msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                    });
                };
            });
    }
    
    function showRoomsPanel() {
        const mainPanel = document.getElementById('main-panel');
        if (!mainPanel) return;
        mainPanel.innerHTML = `
            <div id="rooms-menu" class="flex flex-col md:flex-row flex-wrap gap-3 mb-6 justify-center">
                <button id="user-rooms-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Pokoje użytkownika</button>
                <button id="group-rooms-btn" class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Pokoje grupy</button>
                <button id="change-availability-btn" class="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Zmień dostępność</button>
                <button id="change-room-group-btn" class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Zmień grupę pokoju</button>
                <button id="cancel-rooms-btn" class="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Anuluj</button>
            </div>
            <div id="rooms-action-panel" class="bg-gray-50 p-4 rounded-lg border"></div>
            <div id="rooms-table-panel" class="mt-6"></div>
        `;
        document.getElementById('user-rooms-btn').onclick = showUserRoomsForm;
        document.getElementById('group-rooms-btn').onclick = showGroupRoomsForm;
        document.getElementById('change-availability-btn').onclick = showChangeAvailabilityPanel;
        document.getElementById('change-room-group-btn').onclick = showChangeRoomGroupForm;
        document.getElementById('cancel-rooms-btn').onclick = () => window.location.reload();
    }

    function showChangeRoomGroupForm() {
        const panel = document.getElementById('rooms-action-panel');
        const tablePanel = document.getElementById('rooms-table-panel');
        panel.innerHTML = '<p>Ładowanie danych...</p>';
        if (tablePanel) tablePanel.innerHTML = '';
        
        fetch('/api/rooms/list/')
            .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
            .then(data => {
                const rooms = data.rooms || [];
                const groups = data.groups || [];
                
                let tableHtml = `<div class="overflow-x-auto"><table class="min-w-full bg-white border border-gray-200 rounded-lg shadow"><thead class="bg-gray-100"><tr>
                                 <th class="px-4 py-2 border-b">ID pokoju</th><th class="px-4 py-2 border-b">Grupy dostępu</th><th class="px-4 py-2 border-b">Status</th>
                                 </tr></thead><tbody>`;
                tableHtml += rooms.map(room => {
                    const groupNames = (room.Groups || []).map(g => `${g.AccessGroupName} (#${g.AccessGroupID})`).join(', ') || '-';
                    return `<tr class="hover:bg-gray-50"><td class="px-4 py-2 border-b">${room.RoomID}</td><td class="px-4 py-2 border-b">${groupNames}</td><td class="px-4 py-2 border-b">${room.Status}</td></tr>`;
                }).join('');
                tableHtml += '</tbody></table></div>';
                tablePanel.innerHTML = tableHtml;

                let roomOptions = rooms.map(room => `<option value="${room.RoomID}">${room.RoomID}</option>`).join('');
                let groupCheckboxes = groups.map(g => {
                    let id = g.AccessGroupID || g.id || g.ID || '';
                    let name = g.GroupName || g.name || g.Name || '';
                    return `<label class="block"><input type='checkbox' name='change-room-group' value='${id}' class="mr-2"> ${name} (#${id})</label>`;
                }).join('');

                panel.innerHTML = `
                    <form id="change-room-group-form">
                        <select id="change-room-select" required class="block w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">${roomOptions}</select>
                        <div id="change-room-groups" class="my-2 space-y-1">${groupCheckboxes}</div>
                        <button type="submit" class="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors">Zmień grupy dostępu</button>
                    </form>
                    <div id="change-room-group-msg" class="p-2 mt-3 rounded hidden"></div>
                `;
                document.getElementById('change-room-group-form').onsubmit = function(e) {
                    e.preventDefault();
                    const room_id = document.getElementById('change-room-select').value;
                    const access_group_ids = Array.from(document.querySelectorAll('input[name="change-room-group"]:checked')).map(cb => cb.value);
                    const msgDiv = document.getElementById('change-room-group-msg');
                    
                    if (!room_id || !access_group_ids.length) {
                        msgDiv.textContent = 'Wybierz pokój i co najmniej jedną grupę!';
                        msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                        return;
                    }
                    fetch('/api/rooms/change_groups/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ room_id, access_group_ids })
                    })
                    .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
                    .then(data => {
                        if (data.success) {
                            msgDiv.textContent = 'Zmieniono grupy dostępu pokoju';
                            msgDiv.className = 'p-2 mt-3 rounded bg-green-100 border border-green-400 text-green-700';
                            setTimeout(showChangeRoomGroupForm, 500);
                        } else {
                            msgDiv.textContent = 'Błąd: ' + (data.error || 'nieznany');
                            msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                        }
                    })
                    .catch(err => {
                        msgDiv.textContent = 'Błąd sieci: ' + err;
                        msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                    });
                };
            })
            .catch(err => {
                panel.innerHTML = `<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">Błąd sieci: ${err}</div>`;
            });
    }

    function showChangeAvailabilityPanel() {
        const panel = document.getElementById('rooms-action-panel');
        const tablePanel = document.getElementById('rooms-table-panel');
        panel.innerHTML = '';
        tablePanel.innerHTML = '<p>Ładowanie pokoi...</p>';

        fetch('/api/rooms/all/')
            .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
            .then(data => {
                const rooms = data.rooms || [];
                let html = `<div class="overflow-x-auto"><table class="min-w-full bg-white border border-gray-200 rounded-lg shadow"><thead class="bg-gray-100"><tr>
                            <th class="px-4 py-2 border-b">ID pokoju</th><th class="px-4 py-2 border-b">Status</th><th class="px-4 py-2 border-b">Akcja</th>
                            </tr></thead><tbody>`;
                html += rooms.map(room => `
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-2 border-b">${room.RoomID}</td>
                        <td class="px-4 py-2 border-b">${room.Status}</td>
                        <td class="px-4 py-2 border-b"><button class="toggle-availability-btn bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold py-1 px-3 rounded shadow transition-colors" data-room="${room.RoomID}">Zmień</button></td>
                    </tr>`).join('');
                html += '</tbody></table></div><div id="availability-msg" class="p-2 mt-3 rounded hidden"></div>';
                tablePanel.innerHTML = html;
                
                document.querySelectorAll('.toggle-availability-btn').forEach(btn => {
                    btn.onclick = function() {
                        const roomId = this.getAttribute('data-room');
                        const msgDiv = document.getElementById('availability-msg');
                        fetch(`/api/rooms/toggle/${roomId}/`, { method: 'POST' })
                            .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
                            .then(data => {
                                if (data.success) {
                                    msgDiv.textContent = 'Zmieniono dostępność pokoju.';
                                    msgDiv.className = 'p-2 mt-3 rounded bg-green-100 border border-green-400 text-green-700';
                                } else {
                                    msgDiv.textContent = 'Błąd: ' + (data.error || 'nieznany');
                                    msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                                }
                                showChangeAvailabilityPanel();
                            })
                            .catch(err => {
                                msgDiv.textContent = 'Błąd sieci: ' + err;
                                msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                            });
                    };
                });
            })
            .catch(err => {
                tablePanel.innerHTML = `<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">Błąd sieci: ${err}</div>`;
            });
    }

    function showUserRoomsForm() {
        const panel = document.getElementById('rooms-action-panel');
        const tablePanel = document.getElementById('rooms-table-panel');
        tablePanel.innerHTML = '';
        panel.innerHTML = '<p>Ładowanie użytkowników...</p>';
        fetch('/api/users/list/')
            .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
            .then(data => {
                const users = data.users || [];
                let userOptions = users.map(u => `<option value="${u.UserID}">${u.Name} ${u.Surname} (#${u.UserID})</option>`).join('');
                panel.innerHTML = `
                    <form id="user-rooms-form" class="flex flex-wrap items-center gap-3">
                        <select id="user-rooms-user" required class="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">${userOptions}</select>
                        <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors">Pokaż pokoje</button>
                    </form>
                    <div id="user-rooms-msg" class="p-2 mt-3 rounded hidden"></div>
                `;
                document.getElementById('user-rooms-form').onsubmit = function(e) {
                    e.preventDefault();
                    const user_id = document.getElementById('user-rooms-user').value;
                    const msgDiv = document.getElementById('user-rooms-msg');
                    msgDiv.classList.add('hidden');
                    if (!user_id) return;
                    fetch(`/api/rooms/user/${user_id}/`)
                        .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
                        .then(data => {
                            const rooms = data.rooms || [];
                            let html = `<div class="overflow-x-auto"><table class="min-w-full bg-white border border-gray-200 rounded-lg shadow"><thead class="bg-gray-100"><tr>
                                        <th class="px-4 py-2 border-b">ID pokoju</th><th class="px-4 py-2 border-b">Grupa dostępu</th><th class="px-4 py-2 border-b">Status</th>
                                        </tr></thead><tbody>`;
                            html += rooms.map(room => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-2 border-b">${room.RoomID}</td>
                                    <td class="px-4 py-2 border-b">${room.GroupName || '-'}</td>
                                    <td class="px-4 py-2 border-b">${room.Status}</td>
                                </tr>`).join('');
                            html += '</tbody></table></div>';
                            tablePanel.innerHTML = html;
                            if (rooms.length === 0) {
                                msgDiv.textContent = 'Brak pokoi dla wybranego użytkownika.';
                                msgDiv.className = 'p-2 mt-3 rounded bg-yellow-100 border border-yellow-400 text-yellow-700';
                            }
                        })
                        .catch(err => {
                            msgDiv.textContent = 'Błąd sieci: ' + err;
                            msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                        });
                };
            })
            .catch(err => {
                panel.innerHTML = `<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">Błąd sieci: ${err}</div>`;
            });
    }

    function showGroupRoomsForm() {
        const panel = document.getElementById('rooms-action-panel');
        const tablePanel = document.getElementById('rooms-table-panel');
        tablePanel.innerHTML = '';
        panel.innerHTML = '<p>Ładowanie grup...</p>';
        fetch('/api/users/list/')
            .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
            .then(data => {
                const groups = data.groups || [];
                let groupOptions = groups.map(g => {
                    let id = g.AccessGroupID || g.id || g.ID || '';
                    let name = g.GroupName || g.name || g.Name || '';
                    return `<option value="${id}">${name} (#${id})</option>`;
                }).join('');
                panel.innerHTML = `
                    <form id="group-rooms-form" class="flex flex-wrap items-center gap-3">
                        <select id="group-rooms-group" required class="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">${groupOptions}</select>
                        <button type="submit" class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors">Pokaż pokoje</button>
                    </form>
                    <div id="group-rooms-msg" class="p-2 mt-3 rounded hidden"></div>
                `;
                document.getElementById('group-rooms-form').onsubmit = function(e) {
                    e.preventDefault();
                    const group_id = document.getElementById('group-rooms-group').value;
                    const msgDiv = document.getElementById('group-rooms-msg');
                    msgDiv.classList.add('hidden');
                    if (!group_id) return;
                    fetch(`/api/rooms/group/${group_id}/`)
                        .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
                        .then(data => {
                            const rooms = data.rooms || [];
                            let html = `<div class="overflow-x-auto"><table class="min-w-full bg-white border border-gray-200 rounded-lg shadow"><thead class="bg-gray-100"><tr>
                                        <th class="px-4 py-2 border-b">ID pokoju</th><th class="px-4 py-2 border-b">Status</th>
                                        </tr></thead><tbody>`;
                            html += rooms.map(room => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-2 border-b">${room.RoomID}</td>
                                    <td class="px-4 py-2 border-b">${room.Status}</td>
                                </tr>`).join('');
                            html += '</tbody></table></div>';
                            tablePanel.innerHTML = html;
                            if (rooms.length === 0) {
                                msgDiv.textContent = 'Brak pokoi dla wybranej grupy.';
                                msgDiv.className = 'p-2 mt-3 rounded bg-yellow-100 border border-yellow-400 text-yellow-700';
                            }
                        })
                        .catch(err => {
                            msgDiv.textContent = 'Błąd sieci: ' + err;
                            msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                        });
                };
            })
            .catch(err => {
                panel.innerHTML = `<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">Błąd sieci: ${err}</div>`;
            });
    }

    function renderUsersTable() {
        fetch('/api/users/list/')
            .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
            .then(data => {
                const users = data.users || [];
                let html = `
                
                <table class="min-w-full bg-white border border-gray-200 rounded-lg shadow">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                      <th class="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Imię</th>
                      <th class="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Nazwisko</th>
                      <th class="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Grupy dostępu</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">`;
                for (const u of users) {
                    let groupStr = (u.Groups && u.Groups.length > 0) 
                        ? u.Groups.map(g => `${g.AccessGroupName} (#${g.AccessGroupID})`).join(', ') 
                        : '-';
                    html += `<tr class="hover:bg-gray-50">
                        <td class="px-4 py-2 border-b whitespace-nowrap">${u.UserID}</td>
                        <td class="px-4 py-2 border-b whitespace-nowrap">${u.Name}</td>
                        <td class="px-4 py-2 border-b whitespace-nowrap">${u.Surname}</td>
                        <td class="px-4 py-2 border-b">${groupStr}</td>
                    </tr>`;
                }
                html += '</tbody></table>';
                document.getElementById('users-table-panel').innerHTML = html;
            });
    }

    function showTableViewPanel() {
        const mainPanel = document.getElementById('main-panel');
        if (!mainPanel) return;
        mainPanel.innerHTML = `
            <div id="table-view-menu" class="flex flex-col md:flex-row gap-3 mb-6 justify-center">
                <button id="restore-db-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Przywróć bazę danych</button>
                <button id="cancel-table-view-btn" class="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Anuluj</button>
            </div>
            <div id="table-view-msg" class="p-2 my-4 rounded hidden"></div>
            <div id="table-view-tables" class="mt-6 space-y-8"></div>
        `;
        document.getElementById('restore-db-btn').onclick = function() {
            fetch('/api/db/restore/', { method: 'POST' })
                .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
                .then(data => {
                    const msg = document.getElementById('table-view-msg');
                    if (data.success) {
                        msg.textContent = 'Baza została przywrócona!';
                        msg.className = 'p-2 my-4 rounded bg-green-100 border border-green-400 text-green-700';
                        renderAllTables();
                    } else {
                        msg.textContent = 'Błąd: ' + (data.error || 'nieznany');
                        msg.className = 'p-2 my-4 rounded bg-red-100 border border-red-400 text-red-700';
                    }
                });
        };
        document.getElementById('cancel-table-view-btn').onclick = () => window.location.reload();
        renderAllTables();
    }

    function renderAllTables() {
        const tablesContainer = document.getElementById('table-view-tables');
        tablesContainer.innerHTML = '<p>Ładowanie tabel...</p>';
        fetch('/api/db/tables/')
            .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
            .then(data => {
                let html = data.tables.map(table => {
                    let tableHtml = `<h3 class="text-2xl font-bold mb-2">${table.name}</h3>`;
                    tableHtml += '<div class="overflow-x-auto"><table class="min-w-full bg-white border border-gray-200 rounded-lg shadow"><thead class="bg-gray-100"><tr>';
                    tableHtml += table.columns.map(col => `<th class="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">${col}</th>`).join('');
                    tableHtml += '</tr></thead><tbody class="divide-y divide-gray-200">';
                    tableHtml += table.rows.map(row => {
                        let rowHtml = '<tr class="hover:bg-gray-50">';
                        rowHtml += table.columns.map(col => {
                            let value = row[col] ?? '-';
                            return `<td class="px-4 py-2 border-b whitespace-nowrap">${value}</td>`;
                        }).join('');
                        rowHtml += '</tr>';
                        return rowHtml;
                    }).join('');
                    tableHtml += '</tbody></table></div>';
                    return tableHtml;
                }).join('');
                tablesContainer.innerHTML = html;
            });
    }

    function showPermissionsPanel() {
        const mainPanel = document.getElementById('main-panel');
        if (!mainPanel) return;
        mainPanel.innerHTML = `
            <div id="permissions-menu" class="flex flex-col md:flex-row flex-wrap gap-3 mb-6 justify-center">
                <button id="show-group-btn" class="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Zobacz grupę dostępu</button>
                <button id="cancel-permissions-btn" class="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Anuluj</button>
            </div>
            <div id="permissions-action-panel" class="bg-gray-50 p-4 rounded-lg border"></div>
            <div id="permissions-users-table" class="mt-6"></div>
            <div id="permissions-rooms-table" class="mt-6"></div>
        `;
        document.getElementById('show-group-btn').onclick = showGroupAccessForm;
        document.getElementById('cancel-permissions-btn').onclick = () => window.location.reload();
    }

    function showGroupAccessForm() {
        const panel = document.getElementById('permissions-action-panel');
        panel.innerHTML = '<p>Ładowanie grup...</p>';
        fetch('/api/users/list/')
            .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
            .then(data => {
                const groups = data.groups || [];
                let groupOptions = groups.map(g => {
                    let id = g.AccessGroupID || g.id || g.ID || '';
                    let name = g.GroupName || g.name || g.Name || '';
                    return `<option value="${id}">${name} (#${id})</option>`;
                }).join('');
                panel.innerHTML = `
                    <form id="group-access-form" class="flex flex-wrap items-center gap-3">
                        <select id="group-access-group" required class="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">${groupOptions}</select>
                        <button type="submit" class="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors">Pokaż</button>
                    </form>
                `;
                document.getElementById('group-access-form').onsubmit = function(e) {
                    e.preventDefault();
                    const group_id = document.getElementById('group-access-group').value;
                    if (!group_id) return;
                    
                    // Pobierz użytkowników tej grupy
                    fetch('/api/users/list/')
                        .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
                        .then(data => {
                            const users = (data.users || []).filter(u => (u.Groups || []).some(g => g.AccessGroupID == group_id));
                            let html = '<h4 class="text-xl font-semibold mt-6 mb-2">Użytkownicy w tej grupie</h4>';
                            html += `<div class="overflow-x-auto"><table class="min-w-full bg-white border border-gray-200 rounded-lg shadow"><thead class="bg-gray-100"><tr>
                                     <th class="px-4 py-2 border-b">ID</th><th class="px-4 py-2 border-b">Imię</th><th class="px-4 py-2 border-b">Nazwisko</th></tr></thead><tbody>`;
                            html += users.map(u => `<tr><td class="px-4 py-2 border-b">${u.UserID}</td><td class="px-4 py-2 border-b">${u.Name}</td><td class="px-4 py-2 border-b">${u.Surname}</td></tr>`).join('');
                            html += '</tbody></table></div>';
                            document.getElementById('permissions-users-table').innerHTML = users.length > 0 ? html : '<p class="mt-4">Brak użytkowników w tej grupie.</p>';
                        });

                    // Pobierz pokoje tej grupy
                    fetch(`/api/rooms/group/${group_id}/`)
                        .then((r) => r.ok ? r.json() : Promise.reject('Błąd serwera'))
                        .then(data => {
                            const rooms = data.rooms || [];
                            let html = '<h4 class="text-xl font-semibold mt-6 mb-2">Pokoje dla tej grupy</h4>';
                            html += `<div class="overflow-x-auto"><table class="min-w-full bg-white border border-gray-200 rounded-lg shadow"><thead class="bg-gray-100"><tr>
                                     <th class="px-4 py-2 border-b">ID pokoju</th><th class="px-4 py-2 border-b">Status</th></tr></thead><tbody>`;
                            html += rooms.map(room => `<tr><td class="px-4 py-2 border-b">${room.RoomID}</td><td class="px-4 py-2 border-b">${room.Status}</td></tr>`).join('');
                            html += '</tbody></table></div>';
                            document.getElementById('permissions-rooms-table').innerHTML = rooms.length > 0 ? html : '<p class="mt-4">Brak pokoi przypisanych do tej grupy.</p>';
                        });
                };
            });
    }

    function showReservationsPanel() {
        const mainPanel = document.getElementById('main-panel');
        if (!mainPanel) return;
        mainPanel.innerHTML = `
            <div id="reservations-menu" class="flex flex-col md:flex-row gap-3 mb-6 justify-center">
                <button id="add-reservation-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Dodaj rezerwację</button>
                <button id="delete-reservation-btn" class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Usuń rezerwację</button>
                <button id="cancel-reservations-btn" class="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Anuluj</button>
            </div>
            <div id="reservations-action-panel" class="bg-gray-50 p-4 rounded-lg border"></div>
            <div id="reservations-table-panel" class="mt-6"></div>
        `;
        document.getElementById('add-reservation-btn').onclick = showAddReservationForm;
        document.getElementById('delete-reservation-btn').onclick = showDeleteReservationForm;
        document.getElementById('cancel-reservations-btn').onclick = () => window.location.reload();
        renderReservationsTable();
    }

        function renderReservationsTable() {
        const tablePanel = document.getElementById('reservations-table-panel');
        if (!tablePanel) return;
        tablePanel.innerHTML = '<p>Ładowanie rezerwacji...</p>';
        fetch('/api/reservations/list/')
            .then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
            .then(data => {
                const reservations = data.reservations || [];
                let html = `
                <div class="overflow-x-auto">
                 <table class="min-w-full bg-white border border-gray-200 rounded-lg shadow">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                      <th class="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Użytkownik</th>
                      <th class="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Pokój</th>
                      <th class="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Data</th>
                      <th class="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Od</th>
                      <th class="px-4 py-2 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Do</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">`;
                for (const r of reservations) {
                    html += `<tr class="hover:bg-gray-50">
                        <td class="px-4 py-2 border-b">${r.ReservationID}</td>
                        <td class="px-4 py-2 border-b">${r.UserName} (#${r.UserID})</td>
                        <td class="px-4 py-2 border-b">${r.RoomID}</td>
                        <td class="px-4 py-2 border-b">${r.Date}</td>
                        <td class="px-4 py-2 border-b">${r.StartHour}</td>
                        <td class="px-4 py-2 border-b">${r.EndHour}</td>
                    </tr>`;
                }
                html += '</tbody></table></div>';
                tablePanel.innerHTML = html;
            })
            .catch(err => {
                tablePanel.innerHTML = `<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">Błąd sieci: ${err}</div>`;
            });
    }

    function showAddReservationForm() {
        const panel = document.getElementById('reservations-action-panel');
        panel.innerHTML = '<p>Ładowanie danych...</p>';
        Promise.all([
            fetch('/api/users/list/').then(r => r.ok ? r.json() : Promise.reject('Błąd serwera')),
            fetch('/api/rooms/list/').then(r => r.ok ? r.json() : Promise.reject('Błąd serwera'))
        ]).then(([usersData, roomsData]) => {
            const users = usersData.users || [];
            const rooms = roomsData.rooms || [];
            let userOptions = users.map(u => `<option value="${u.UserID}">${u.Name} ${u.Surname} (#${u.UserID})</option>`).join('');
            let roomOptions = rooms.map(room => `<option value="${room.RoomID}">${room.RoomID}</option>`).join('');
            panel.innerHTML = `
                <form id="add-reservation-form" class="space-y-4">
                    <select id="reservation-user" required class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">${userOptions}</select>
                    <select id="reservation-room" required class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">${roomOptions}</select>
                    <input type="date" id="reservation-date" required class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <div class="flex gap-4">
                        <input type="time" id="reservation-start" required class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <input type="time" id="reservation-end" required class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
                    </div>
                    <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Dodaj rezerwację</button>
                </form>
                <div id="add-reservation-msg" class="p-2 mt-3 rounded hidden"></div>
            `;
            document.getElementById('add-reservation-form').onsubmit = function(e) {
                e.preventDefault();
                const user_id = document.getElementById('reservation-user').value;
                const room_id = document.getElementById('reservation-room').value;
                const date = document.getElementById('reservation-date').value;
                const start_hour = document.getElementById('reservation-start').value;
                const end_hour = document.getElementById('reservation-end').value;
                const msgDiv = document.getElementById('add-reservation-msg');
                
                if (!user_id || !room_id || !date || !start_hour || !end_hour) {
                    msgDiv.textContent = 'Wszystkie pola są wymagane!';
                    msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                    return;
                }
                fetch('/api/reservations/add/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id, room_id, date, start_hour, end_hour })
                })
                .then(r => r.json().then(data => ({ ok: r.ok, data })))
                .then(({ ok, data }) => {
                    if (ok && data.success) {
                        msgDiv.textContent = 'Dodano rezerwację';
                        msgDiv.className = 'p-2 mt-3 rounded bg-green-100 border border-green-400 text-green-700';
                        renderReservationsTable();
                    } else {
                        msgDiv.textContent = 'Błąd: ' + (data.error || 'nieznany');
                        msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                    }
                })
                .catch(err => {
                    msgDiv.textContent = 'Błąd sieci: ' + err;
                    msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                });
            };
        });
    }

    function showDeleteReservationForm() {
        const panel = document.getElementById('reservations-action-panel');
        panel.innerHTML = `
            <form id="delete-reservation-form" class="flex flex-wrap items-center gap-3">
                <input type="number" id="delete-reservation-id" placeholder="ID rezerwacji do usunięcia" required class="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
                <button type="submit" class="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Usuń rezerwację</button>
            </form>
            <div id="delete-reservation-msg" class="p-2 mt-3 rounded hidden"></div>
        `;
        document.getElementById('delete-reservation-form').onsubmit = async function(e) {
            e.preventDefault();
            const reservation_id = document.getElementById('delete-reservation-id').value;
            const msgDiv = document.getElementById('delete-reservation-msg');
            msgDiv.classList.add('hidden');
            if (!reservation_id) return;
            try {
                const response = await fetch('/api/reservations/delete/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reservation_id })
                });
                const data = await response.json().catch(() => null);
                if (response.ok && data && data.success) {
                    msgDiv.textContent = 'Rezerwacja usunięta';
                    msgDiv.className = 'p-2 mt-3 rounded bg-green-100 border border-green-400 text-green-700';
                    renderReservationsTable();
                } else {
                    msgDiv.textContent = 'Błąd: ' + (data?.error || 'Rezerwacja o podanym ID nie istnieje.');
                    msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                }
            } catch (err) {
                msgDiv.textContent = 'Błąd sieci: ' + err;
                msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
            }
        };
    }

    function showAccountPanel() {
        const mainPanel = document.getElementById('main-panel');
        if (!mainPanel) return;
        mainPanel.innerHTML = `
            <div id="account-menu" class="flex flex-col md:flex-row flex-wrap gap-3 mb-6 justify-center">
                <button id="change-password-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Zmień hasło</button>
                <button id="create-user-btn" class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Stwórz użytkownika</button>
                <button id="reset-accounts-btn" class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Przywróć domyślne</button>
                <button id="cancel-account-btn" class="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Anuluj</button>
            </div>
            <div id="account-action-panel" class="bg-gray-50 p-4 rounded-lg border"></div>
        `;
        document.getElementById('change-password-btn').onclick = showChangePasswordForm;
        document.getElementById('create-user-btn').onclick = showCreateUserForm;
        document.getElementById('reset-accounts-btn').onclick = resetAccountsToDefault;
        document.getElementById('cancel-account-btn').onclick = () => window.location.reload();
    }

    function resetAccountsToDefault() {
        if (!confirm('Czy na pewno chcesz przywrócić domyślne konta? Spowoduje to usunięcie wszystkich obecnych użytkowników i wylogowanie.')) return;
        localStorage.removeItem('appUsers');
        localStorage.removeItem('appUser');
        localStorage.removeItem('loggedIn');
        currentAppUser = null;
        localStorage.setItem('appUsers', JSON.stringify({admin: 'pass'}));
        window.location.replace('/login/');
    }

    function showChangePasswordForm() {
        const panel = document.getElementById('account-action-panel');
        panel.innerHTML = `
            <form id="change-password-form" class="space-y-4">
                <input type="password" id="current-password" placeholder="Aktualne hasło" required class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
                <input type="password" id="new-password" placeholder="Nowe hasło" required class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
                <input type="password" id="repeat-new-password" placeholder="Powtórz nowe hasło" required class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
                <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Zmień hasło</button>
            </form>
            <div id="change-password-msg" class="p-2 mt-3 rounded hidden"></div>
        `;
        document.getElementById('change-password-form').onsubmit = function(e) {
            e.preventDefault();
            const current = document.getElementById('current-password').value;
            const next = document.getElementById('new-password').value;
            const repeat = document.getElementById('repeat-new-password').value;
            const msgDiv = document.getElementById('change-password-msg');
            const user = localStorage.getItem('appUser') || currentAppUser;
            
            if (!user) {
                msgDiv.textContent = 'Brak zalogowanego użytkownika!';
                msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                return;
            }
            if (!current || !next || !repeat) {
                msgDiv.textContent = 'Wszystkie pola są wymagane!';
                msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                return;
            }
            const users = JSON.parse(localStorage.getItem('appUsers') || '{}');
            if (!users[user] || users[user] !== current) {
                msgDiv.textContent = 'Nieprawidłowe aktualne hasło!';
                msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                return;
            }
            if (next !== repeat) {
                msgDiv.textContent = 'Nowe hasła się nie zgadzają!';
                msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                return;
            }
            users[user] = next;
            localStorage.setItem('appUsers', JSON.stringify(users));
            msgDiv.textContent = 'Hasło zmienione!';
            msgDiv.className = 'p-2 mt-3 rounded bg-green-100 border border-green-400 text-green-700';
            document.getElementById('change-password-form').reset();
        };
    }

    function showCreateUserForm() {
        const panel = document.getElementById('account-action-panel');
        panel.innerHTML = `
            <form id="create-user-form" class="space-y-4">
                <input type="text" id="new-username" placeholder="Nazwa użytkownika" required class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400">
                <input type="password" id="new-user-password" placeholder="Hasło" required class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400">
                <input type="password" id="repeat-user-password" placeholder="Powtórz hasło" required class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400">
                <button type="submit" class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow transition-colors">Stwórz użytkownika</button>
            </form>
            <div id="create-user-msg" class="p-2 mt-3 rounded hidden"></div>
        `;
        document.getElementById('create-user-form').onsubmit = function(e) {
            e.preventDefault();
            const username = document.getElementById('new-username').value.trim();
            const pass = document.getElementById('new-user-password').value;
            const repeat = document.getElementById('repeat-user-password').value;
            const msgDiv = document.getElementById('create-user-msg');

            if (!username || !pass || !repeat) {
                msgDiv.textContent = 'Wszystkie pola są wymagane!';
                msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                return;
            }
            const users = JSON.parse(localStorage.getItem('appUsers') || '{}');
            if (users[username]) {
                msgDiv.textContent = 'Taki użytkownik już istnieje!';
                msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                return;
            }
            if (pass !== repeat) {
                msgDiv.textContent = 'Hasła się nie zgadzają!';
                msgDiv.className = 'p-2 mt-3 rounded bg-red-100 border border-red-400 text-red-700';
                return;
            }
            users[username] = pass;
            localStorage.setItem('appUsers', JSON.stringify(users));
            msgDiv.textContent = 'Użytkownik utworzony!';
            msgDiv.className = 'p-2 mt-3 rounded bg-green-100 border border-green-400 text-green-700';
            document.getElementById('create-user-form').reset();
        };
    }

    function renderCurrentUser() {
        let userDiv = document.getElementById('current-user-info');
        if (!userDiv) {
            userDiv = document.createElement('div');
            userDiv.id = 'current-user-info';
            userDiv.className = 'fixed top-2.5 left-2.5 z-[1001] bg-white font-bold py-1 px-3 rounded-md shadow-md border border-gray-200';
            document.body.appendChild(userDiv);
        }
        userDiv.textContent = 'Zalogowany jako: ' + (localStorage.getItem('appUser') || 'admin');
    }
    renderCurrentUser();
});