document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('add-person-form');
    const list = document.getElementById('people-list');

    function fetchPeople() {
        fetch('/api/people/')
            .then(response => response.json())
            .then(data => {
                list.innerHTML = '';
                data.forEach(person => {
                    const li = document.createElement('li');
                    li.textContent = person.first_name + ' ' + person.last_name;
                    list.appendChild(li);
                });
            });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const first_name = form.elements['first_name'].value;
        const last_name = form.elements['last_name'].value;
        fetch('/api/people/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name, last_name })
        })
        .then(response => response.json())
        .then(data => {
            fetchPeople();
            form.reset();
        });
    });

    fetchPeople();
});
