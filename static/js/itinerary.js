document.addEventListener('DOMContentLoaded', function() {
    initMap();
    populateAttractions();
});

async function populateAttractions() {
    try {
        const response = await fetch('http://localhost:5000/attractions');
        const data = await response.json();
        const attractions = data.attractions;

        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        let currentDate = new Date(startDate);

        const accordionElement = document.getElementById('accordion');
        accordionElement.innerHTML = ''; // Clear existing content

        let dayCounter = 0;

        while (currentDate <= endDate) {
            const dateString = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            let dayAttractionsHtml = '';
            const startIndex = dayCounter * 5;
            const endIndex = startIndex + 5;

            attractions.slice(startIndex, Math.min(endIndex, attractions.length)).forEach(attraction => {
                dayAttractionsHtml += `
                    <a href="#" class="list-group-item list-group-item-action flex-column align-items-start" data-lat="${attraction.point.lat}" data-lon="${attraction.point.lon}">
                        <div class="d-flex w-100 justify-content-between">
                            <h5 class="mb-1">${attraction.name}</h5>
                        </div>
                        <p class="mb-1">${attraction.dist} meters away</p>
                        <small>Kinds: ${attraction.kinds}</small>
                        <small>Coordinates: Lat ${attraction.point.lat}, Lng ${attraction.point.lon}</small>
                    </a>
                `;
            });

            const accordionItemHtml = `
                <div class="card">
                <div class="card-header" id="heading${dayCounter}">
                    <h5 class="mb-0">
                        <button class="btn btn-link" data-toggle="collapse" data-target="#collapse${dayCounter}" aria-expanded="false" aria-controls="collapse${dayCounter}">
                            <span class="location-icon">📍</span>${dateString}
                        </button>
                    </h5>
                </div>
                <div id="collapse${dayCounter}" class="collapse" aria-labelledby="heading${dayCounter}">
                    <div class="card-body">
                        <div class="list-group">
                            ${dayAttractionsHtml}
                        </div>
                    </div>
                </div>
            </div>
            `;

            accordionElement.innerHTML += accordionItemHtml;
            
            // Prepare for the next day
            currentDate.setDate(currentDate.getDate() + 1);
            dayCounter++;
        }

        // Similar event listeners for each attraction item, adjusted for the new structure
        let attractionMarker;

        document.querySelectorAll('.list-group-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent default anchor behavior
                const lat = parseFloat(this.getAttribute('data-lat'));
                const lon = parseFloat(this.getAttribute('data-lon'));
                const latLng = L.latLng(lat, lon);
            
                // Check if a marker already exists; if so, remove it
                if (attractionMarker) {
                    map.removeLayer(attractionMarker);
                }
            
                // Add a new marker to the map at the clicked attraction's coordinates
                attractionMarker = L.marker(latLng).addTo(map)
                    .bindPopup(this.querySelector('.mb-1').textContent).openPopup();
            
                // Center the map on the new marker and adjust the zoom level
                map.setView(latLng, 13);
            });
        });
    } catch (error) {
        console.error('Error fetching attractions:', error);
    }
}

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

