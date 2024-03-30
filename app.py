from flask import Flask, request, jsonify, render_template
import sqlite3
import requests
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)


trip_details = {
    'attractions': [],  # This will hold the list of attractions
    'start_date': '',
    'end_date': '',
    'budget': 0
}
# Function to query the database for attractions
def query_attractions(destination, duration, budget):
    conn = sqlite3.connect('your_database.db')
    c = conn.cursor()

    c.execute("SELECT * FROM Attractions \
               WHERE tagged_place LIKE ? \
               AND time_spent <= ? \
               AND predicted_cost <= ?",
              ('%' + destination + '%', duration, budget))

    results = c.fetchall()

    conn.close()

    return results

# API endpoint to handle search requests for attractions
@app.route('/search', methods=['GET'])
def search_attractions():
    # Get parameters from the request
    destination = request.args.get('destination')
    duration = request.args.get('duration')
    budget = request.args.get('budget')

    # Validate parameters
    if not duration or not budget:
        return jsonify({'error': 'Duration and budget parameters are required'}), 400

    try:
        duration = int(duration)
        budget = float(budget)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid input for duration or budget. Please provide numeric values'}), 400

    # Query the database for attractions
    attractions = query_attractions(destination, duration, budget)

    # Return results as JSON
    return jsonify(attractions)



GEOCODE_API_URL = "https://api.opencagedata.com/geocode/v1/json"
API_KEY = "8b09d1ea7ac84a92a2070a46402858dd"

@app.route('/geocode', methods=['GET'])
def geocode():
    # Extract query from request arguments
    query = request.args.get('query', '')
    if not query:
        return jsonify({'error': 'Missing query parameter'}), 400

    params = {
        'q': query,
        'key': API_KEY,
    }
    # Make a request to the OpenCage API
    response = requests.get(GEOCODE_API_URL, params=params)
    if response.status_code == 200:
        return jsonify(response.json()), 200
    else:
        return jsonify({'error': 'Failed to fetch geocoding data'}), response.status_code
    

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/itinerary')
def attractions():
    return render_template('itinerary.html')


@app.route('/store-attractions', methods=['POST'])
def save_attractions():
    global trip_details  # Referencing the global variable
    data = request.json
    
    # Store the provided data
    trip_details['attractions'] = data.get('attractions', [])
    trip_details['start_date'] = data.get('startDate', '')
    trip_details['end_date'] = data.get('endDate', '')
    trip_details['budget'] = data.get('budget', 0)

    # Debug print to console
    print(f"The attractions are: {trip_details['attractions']}")
    print(f"Start Date: {trip_details['start_date']}, End Date: {trip_details['end_date']}, Budget: {trip_details['budget']}")

    return jsonify({"message": "Attractions and trip details saved successfully"}), 200

@app.route('/attractions', methods=['GET'])
def get_attractions():
    # Return the entire trip details, including attractions, start/end dates, and budget
    return jsonify(trip_details), 200


if __name__ == '__main__':
    app.run(debug=True)
