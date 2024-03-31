document.addEventListener('DOMContentLoaded', function() {
    initMap();
    populateAttractions();

    $('#accordion').on('show.bs.collapse', '.collapse', function(event) {
        const button = $(`[data-target="#${this.id}"]`); // Find the button that controls the collapsing panel
        button.addClass('rotate');
    });

    $('#accordion').on('hide.bs.collapse', '.collapse', function(event) {
        const button = $(`[data-target="#${this.id}"]`); // Find the button that controls the collapsing panel
        button.removeClass('rotate');
    });
});


let openAccordions = {}; // Object to track open accordions by dayCounter
let selectedAttraction = null; // Store the currently selected attraction

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

        document.querySelectorAll('.btn-link').forEach(button => {
            button.addEventListener('click', function() {
                const dayCounter = this.getAttribute('data-target').match(/\d+/)[0]; // Extract dayCounter from data-target attribute
                console.log('The dayCounter variable has the value',dayCounter);
                if (openAccordions[dayCounter]) {
                    delete openAccordions[dayCounter];
                } else {
                    openAccordions[dayCounter] = true;
                }
                updateMapMarkersAndRoutes(); // Call function to update markers and routes based on state
            });
        });

        let markers = []; // Array to hold marker references
        let routes = []; // Array to hold route references (if your routing library supports it)

        function updateMapMarkersAndRoutes() {
            clearMarkersAndRoutes(); // Clear existing markers and routes
            console.log("I am here");
            if (selectedAttraction) {
                console.log('The selected attractions are : ', selectedAttraction);
                // If an attraction is selected, show only its marker
                addMarker(selectedAttraction.lat, selectedAttraction.lon, selectedAttraction.name);
                map.setView([selectedAttraction.lat, selectedAttraction.lon], 13); // Optionally center the map
            } else {
                // Iterate over open accordions and plot all attractions for those days
                const waypoints = [];
                console.log('The open accordions are : ', openAccordions);
                Object.keys(openAccordions).forEach(dayCounter => {
                    if (openAccordions[dayCounter]) {
                        const attractionsForDay = getAttractionsForDay(dayCounter);
                        attractionsForDay.forEach(attraction => {
                            console.log('The attractions in the open accordion are : ', attraction);
                            addMarker(attraction.point.lat, attraction.point.lon, attraction.name);
                            waypoints.push(L.latLng(attraction.point.lat, attraction.point.lon));
                        });
                    }
                });
        
                if (waypoints.length > 1) {
                    calculateRoute(waypoints); // If applicable, show route
                } else if (waypoints.length === 1) {
                    map.setView(waypoints[0], 13); // Center on the single waypoint if only one exists
                }
            }
        }
        
        function clearMarkersAndRoutes() {
            markers.forEach(marker => map.removeLayer(marker));
            markers = []; // Reset markers array
            // Remove each route from the map
            routes.forEach(route => route.remove()); // Adjust this line if your routing library uses a different method to remove routes
            routes = []; // Reset routes array
        }
        
        function addMarker(lat, lon, title) {
            const marker = L.marker([lat, lon]).addTo(map).bindPopup(title);
            markers.push(marker); // Store reference to marker for later removal
        }

        function calculateRoute(waypoints) {
            // This example uses Leaflet Routing Machine. Adjust based on your choice of routing service.
            const routeControl = L.Routing.control({
                waypoints: waypoints,
                routeWhileDragging: false,
                createMarker: function() { return null; }, // Do not create additional markers
                lineOptions: {
                    styles: [{color: '#6FA1EC', weight: 4}]
                },
                // Use appropriate router depending on the service you've chosen (OSRM, GraphHopper, Mapbox, etc.)
                router: L.Routing.osrmv1({
                    serviceUrl: `https://router.project-osrm.org/route/v1` // Example for OSRM; adjust as needed
                }),
            }).addTo(map);
        
            routes.push(routeControl); // Store reference to route for later removal
        }

        let allAttractions = []; // Assume this is populated with your attractions data after fetching
        const attractionsPerDay = 5; // Assuming you display 5 attractions per day
        allAttractions = data.attractions;

        function getAttractionsForDay(dayCounter) {
            // Calculate the starting index for attractions on this day
            const startIndex = dayCounter * attractionsPerDay;
            // Slice the attractions array to get just the attractions for this day
            const dayAttractions = allAttractions.slice(startIndex, startIndex + attractionsPerDay);
            return dayAttractions;
        }

        
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent default anchor behavior
                const lat = parseFloat(this.getAttribute('data-lat'));
                const lon = parseFloat(this.getAttribute('data-lon'));
                const name = this.querySelector('.mb-1').textContent;
                
                if (selectedAttraction && selectedAttraction.name === name) {
                    selectedAttraction = null; // Deselect if the same attraction is clicked again
                } else {
                    selectedAttraction = { lat, lon, name }; // Select new attraction
                }
                updateMapMarkersAndRoutes(); // Update map based on new state
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


