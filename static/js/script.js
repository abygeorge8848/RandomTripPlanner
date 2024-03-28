document.addEventListener('DOMContentLoaded', function() {
    initMap();
    document.getElementById('searchDestinationsBtn').addEventListener('click', performSearch);

    document.getElementById('budgetRange').oninput = function() {
        document.getElementById('budgetDisplay').innerHTML = `Rs.${this.value}`;
    };

    // Initialize autocomplete for search input
    initAutocomplete();
});

let map;
let searchMarker;

function initMap() {
    if (!map) {
        map = L.map('mapid').setView([51.505, -0.09], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    } else {
        map.invalidateSize();
    }
}

function performSearch() {
    const query = document.getElementById('searchInput').value;
    searchLocation(query);
}

function initAutocomplete() {
    const searchInput = document.getElementById('searchInput');
    const autocompleteResults = document.createElement('div');
    autocompleteResults.setAttribute('id', 'autocompleteResults');
    autocompleteResults.style.position = 'absolute';
    autocompleteResults.style.top = '100%';
    autocompleteResults.style.left = '0';
    autocompleteResults.style.right = '0';
    autocompleteResults.style.zIndex = '1000';
    autocompleteResults.style.backgroundColor = '#fff';
    autocompleteResults.style.border = '1px solid #ddd';
    autocompleteResults.style.borderTop = 'none';
    autocompleteResults.style.display = 'none'; // Initially hidden
    searchInput.parentNode.appendChild(autocompleteResults);

    searchInput.addEventListener('input', function() {
        const query = searchInput.value;
        if (query.length < 3) { // Only start searching after 3 characters
            autocompleteResults.style.display = 'none';
            return;
        }
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                autocompleteResults.innerHTML = ''; // Clear previous results
                if (data.length > 0) {
                    autocompleteResults.style.display = 'block';
                    data.forEach(place => {
                        const option = document.createElement('div');
                        option.innerHTML = place.display_name;
                        option.style.padding = '5px 10px';
                        option.style.cursor = 'pointer';
                        option.addEventListener('click', () => {
                            searchInput.value = place.display_name; // Update input value
                            searchLocation(place.display_name); // Search and update map
                            autocompleteResults.style.display = 'none'; // Hide suggestions
                        });
                        autocompleteResults.appendChild(option);
                    });
                } else {
                    autocompleteResults.style.display = 'none';
                }
            });
    });

    // Hide autocomplete results when clicking outside
    document.addEventListener('click', function(event) {
        if (!searchInput.contains(event.target)) {
            autocompleteResults.style.display = 'none';
        }
    });
}

function searchLocation(query) {
    if (query.length > 0) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const place = data[0];
                    map.setView([place.lat, place.lon], 13);
                    if (searchMarker) map.removeLayer(searchMarker);
                    searchMarker = L.marker([place.lat, place.lon]).addTo(map)
                        .bindPopup(place.display_name)
                        .openPopup();
                } else {
                    alert("Location not found. Please try a different query.");
                }
            })
            .catch(error => {
                console.error('Error fetching location:', error);
                alert("There was an error processing your request. Please try again.");
            });
    }
}

$(function() {
    $('input[name="dateRange"]').daterangepicker({
        opens: 'left'
    }, function(start, end, label) {
        console.log("A new date range was chosen: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
    });
});


document.getElementById('searchDestinationsBtn').addEventListener('click', function() {
    const locationQuery = document.getElementById('searchInput').value;
    if (!locationQuery) {
        alert('Please enter a location.');
        return;
    }

    // Use a geocoding service to find the location
    geocodeLocation(locationQuery)
        .then(coords => {
            // Assuming you have a function to search for nearby attractions
            searchNearbyAttractions(coords);
        })
        .catch(error => console.error('Geocoding failed:', error));
});


async function geocodeLocation(locationQuery) {
    const response = await fetch(`http://localhost:5000/geocode?query=${encodeURIComponent(locationQuery)}`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
        // Assuming the first result is the most relevant
        return { lat: parseFloat(data.results[0].geometry.lat), lng: parseFloat(data.results[0].geometry.lng) };
    } else {
        throw new Error('No results found');
    }
}
