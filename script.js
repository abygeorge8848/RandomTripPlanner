// Initialize map
var mymap = L.map('mapid').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(mymap);

// Setup a marker variable outside your event listener
let searchMarker;

// Improved event listener for map search
document.getElementById('searchInput').addEventListener('change', async function(e) {
    var query = e.target.value;
    if (query.length > 0) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
            const data = await response.json();
            if (data.length > 0) {
                const place = data[0];
                mymap.setView([place.lat, place.lon], 13);
                
                // Check if a marker already exists, if so, remove it
                if (searchMarker) {
                    mymap.removeLayer(searchMarker);
                }

                // Add new marker
                searchMarker = L.marker([place.lat, place.lon]).addTo(mymap)
                    .bindPopup(place.display_name)
                    .openPopup();
            } else {
                alert("Location not found. Please try a different query.");
            }
        } catch (error) {
            console.error('Error fetching location:', error);
            alert("There was an error processing your request. Please try again.");
        }
    }
});

document.getElementById('searchDestinationsBtn').addEventListener('click', function() {
    searchDestinations();
    // Optionally call plotDestinations() here if it should be triggered by the button click
});

async function searchDestinations() {
    // Placeholder functionality for demonstration
    // Remember to add real destination data fetching logic
    const resultsArea = document.getElementById('results');
    resultsArea.innerHTML = `
        <div class="col-sm-4 mt-3">
            <div class="card">
                <img class="card-img-top" src="https://via.placeholder.com/150" alt="Destination Image">
                <div class="card-body">
                    <h5 class="card-title">Destination Name</h5>
                    <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                    <a href="#" class="btn btn-primary">Explore</a>
                </div>
            </div>
        </div>
    `;
}

// Sample array of destinations
const destinations = [
    { name: "Treasure Island", lat: 51.505, lon: -0.09, description: "The first clue to the treasure lies here." },
    { name: "Mystery Cove", lat: 51.515, lon: -0.10, description: "Beware of the pirates that guard this cove." },
    { name: "Hidden Beach", lat: 51.525, lon: -0.08, description: "The final treasure is buried beneath the sands of this beach." }
];

function plotDestinations() {
    let latlngs = [];
    
    destinations.forEach(destination => {
        const { lat, lon, name, description } = destination;

        // Add marker for each destination with a popup
        L.marker([lat, lon])
            .addTo(mymap)
            .bindPopup(`<b>${name}</b><br>${description}`);

            // Collect latlngs for polyline
            latlngs.push([lat, lon]);
        });
    
        // Draw a polyline connecting all destinations
        L.polyline(latlngs, { color: 'gold' }).addTo(mymap);
    
        // Adjust map view to fit all destinations
        mymap.fitBounds(latlngs);
    }
    
    // Optionally, you can call plotDestinations() here if you want it to run as soon as the map is initialized
    // plotDestinations();
    
