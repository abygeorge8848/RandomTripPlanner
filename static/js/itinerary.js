document.addEventListener('DOMContentLoaded', function() {
    initMap();
    populateAttractions();
});

async function populateAttractions() {
    try {
        const response = await fetch('http://localhost:5000/attractions');
        const attractions = await response.json();
        let htmlContent = '';
        attractions.slice(0, 10).forEach((attraction, index) => {
            htmlContent += `
                <a href="#" class="list-group-item list-group-item-action flex-column align-items-start" data-index="${index}">
                    <div class="attraction-content">
                        <h5 class="attraction-name">${attraction.name}</h5>
                        <div class="attraction-info">
                            <span class="attraction-distance">${attraction.dist} meters away</span>
                            <span class="attraction-kinds">Kinds: ${attraction.kinds}</span>
                        </div>
                        <div class="attraction-coordinates">Coordinates: Lat ${attraction.point.lat}, Lng ${attraction.point.lon}</div>
                    </div>
                </a>
            `;
        });
        document.getElementById('attractionsContainer').innerHTML = htmlContent;

        // Event listeners for attraction items
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent the default anchor behavior
                const index = this.getAttribute('data-index');
                const attraction = attractions[index];
                const latLng = [attraction.point.lat, attraction.point.lon];

                if (searchMarker) {
                    map.removeLayer(searchMarker); // Remove the existing marker
                }

                // Add a new marker and center the map on the attraction
                searchMarker = L.marker(latLng).addTo(map)
                    .bindPopup(`<b>${attraction.name}</b><br/>${attraction.kinds}`).openPopup();
                map.setView(latLng, 13); // Adjust the zoom level as needed
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

