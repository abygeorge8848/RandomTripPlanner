document.addEventListener('DOMContentLoaded', function() {
    initMap();
    document.getElementById('searchDestinationsBtnFinal').addEventListener('click', performSearch);

    document.getElementById('searchDestinationsBtn').addEventListener('click', function() {
        const query = document.getElementById('searchInput').value;
        if (!query) {
            alert('Please enter a location.');
            return;
        }
        // This part assumes you have a function to handle searching and marking locations on the map
        searchLocation(query);
    });

    document.getElementById('budgetRange').oninput = function() {
        document.getElementById('budgetDisplay').innerHTML = `Rs.${this.value}`;
    };

    // Initialize autocomplete for search input
    initAutocomplete();

    // Initialize date range picker
    $('input[name="dateRange"]').daterangepicker({
        opens: 'left'
    }, function(start, end, label) {
        console.log("A new date range was chosen: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
    });
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
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const budget = document.getElementById('budgetRange').value;
    const query = document.getElementById('searchInput').value;
    if (!query) {
        alert('Please enter a location.');
        return;
    } else if (!startDate){
        alert('Please enter a start date.');
        return;
    } else if (!endDate){
        alert('Please enter an end date.');
        return;
    }
    document.getElementById('loadingIndicator').style.display = 'flex'; // Show the loading indicator
    geocodeLocation(query)
        .then(coords => {
            searchNearbyAttractions(coords, startDate, endDate, budget).then(() => {
                document.getElementById('loadingIndicator').style.display = 'none'; // Hide the loading indicator
                // Redirect to the itinerary page
                window.location.href = '/itinerary';
            }).catch(error => {
                console.error('Error fetching nearby attractions:', error);
                document.getElementById('loadingIndicator').style.display = 'none'; // Hide the loading indicator
            });
        })
        .catch(error => {
            console.error('Geocoding failed:', error);
            document.getElementById('loadingIndicator').style.display = 'none'; // Hide the loading indicator
        });
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

async function geocodeLocation(locationQuery) {
    // Adjust the fetch URL to point to your backend endpoint
    const response = await fetch(`/geocode?query=${encodeURIComponent(locationQuery)}`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
        // Assuming the OpenCage API structure and that your backend directly relays the API response
        return { lat: parseFloat(data.results[0].geometry.lat), lng: parseFloat(data.results[0].geometry.lng) };
    } else {
        throw new Error('No results found');
    }
}


async function searchNearbyAttractions(coords, startDate, endDate, budget) {
    console.log('Searching for attractions near:', coords);

    const apiKey = '5ae2e3f221c38a28845f05b6078e8eb915a6d09be1eb56996d2d998b'; // Replace with your actual OpenTripMap API key
    const radius = 10000;
    const apiUrl = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${coords.lng}&lat=${coords.lat}&apikey=${apiKey}&format=json`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data && data.length > 0) {
            const dataToSend = {
                attractions: data,
                startDate: startDate,
                endDate: endDate,
                budget: budget
            };
            const flaskResponse = await fetch('http://localhost:5000/store-attractions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend), // Now sending the additional data along with attractions
            });
            const flaskData = await flaskResponse.json();
            console.log(flaskData.message); // Log the response message from Flask
        } else {
            console.log('No attractions found near this location.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}


// Placeholder for a function that adds a marker for an attraction on the map
// You would implement this based on how your map is set up (e.g., using Leaflet, Google Maps API, etc.)
function addAttractionMarker(attraction) {
    const marker = L.marker([attraction.location.lat, attraction.location.lng]).addTo(map);
    marker.bindPopup(`<b>${attraction.name}</b><br>${attraction.description}`).openPopup();
}

