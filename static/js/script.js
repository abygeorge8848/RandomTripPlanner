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

    // Initialize autocomplete for search input
    initAutocomplete();

    flatpickr("#dateRangePicker", {
        mode: "range",
        altInput: true,
        altFormat: "F j, Y",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates) {
            if (selectedDates.length === 2) {
                const startDate = new Date(selectedDates[0].getTime() - selectedDates[0].getTimezoneOffset() * 60000);
                const startDateStr = startDate.toISOString().substring(0, 10);
                const endDate = new Date(selectedDates[1].getTime() - selectedDates[1].getTimezoneOffset() * 60000);
                const endDateStr = endDate.toISOString().substring(0, 10);
                document.getElementById('startDate').value = startDateStr;
                document.getElementById('endDate').value = endDateStr;
            }
        },
        onReady: function(selectedDates, dateStr, instance) {
            // Apply custom style directly or ensure it's applied
            instance.altInput.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"%23000\" class=\"bi bi-calendar3\" viewBox=\"0 0 16 16\"><path d=\"M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z\"/></svg>')";
            instance.altInput.style.backgroundRepeat = "no-repeat";
            instance.altInput.style.backgroundPosition = "10px center";
            instance.altInput.style.paddingLeft = "30px";
        }
    });
    var datePickerInputGroup = document.querySelector('.date-picker-input-group');
    if (datePickerInputGroup) {
        datePickerInputGroup.addEventListener('click', function() {
            document.getElementById('dateRangePicker').focus();
        });
    } else {
        console.log('Element with class ".date-picker-input-group" not found.');
    }
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

