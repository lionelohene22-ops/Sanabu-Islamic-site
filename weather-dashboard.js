// Geocoding API for converting city name to coordinates
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Weather API for getting weather data
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const errorMessage = document.getElementById('error-message');
const currentWeatherDiv = document.getElementById('current-weather');
const forecastSection = document.getElementById('forecast-section');

// Event Listeners
searchBtn.addEventListener('click', () => searchWeather());
locationBtn.addEventListener('click', () => getLocationWeather());
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});

// Search weather by city name
async function searchWeather() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    try {
        // Get coordinates from city name
        const coordinates = await geocodeCity(city);
        if (coordinates) {
            await fetchWeather(coordinates.latitude, coordinates.longitude, city);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('City not found. Please try another search.');
    }
}

// Get weather for user's location
async function getLocationWeather() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                await fetchWeather(latitude, longitude, 'Your Location');
            } catch (error) {
                showError('Unable to fetch weather for your location');
            }
        },
        (error) => {
            showError('Unable to access your location. Please enable location services.');
        }
    );
}

// Geocode city name to coordinates
async function geocodeCity(city) {
    try {
        const response = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            return null;
        }
        
        const result = data.results[0];
        return {
            latitude: result.latitude,
            longitude: result.longitude,
            name: result.name,
            country: result.country
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
}

// Fetch weather data
async function fetchWeather(latitude, longitude, cityName) {
    try {
        showLoading();
        
        const response = await fetch(
            `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        
        if (!response.ok) {
            throw new Error('Weather API error');
        }
        
        const data = await response.json();
        displayWeather(data, cityName);
        
    } catch (error) {
        console.error('Error fetching weather:', error);
        showError('Unable to fetch weather data. Please try again.');
    }
}

// Display current weather
function displayWeather(data, cityName) {
    const current = data.current;
    const daily = data.daily;
    
    // Update current weather
    document.getElementById('city-name').textContent = cityName;
    document.getElementById('weather-date').textContent = new Date(current.time).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.getElementById('temp').textContent = Math.round(current.temperature_2m);
    document.getElementById('feels-like').textContent = Math.round(current.apparent_temperature);
    document.getElementById('humidity').textContent = current.relative_humidity_2m;
    document.getElementById('wind-speed').textContent = current.wind_speed_10m.toFixed(1);
    document.getElementById('pressure').textContent = Math.round(current.pressure_msl);
    document.getElementById('visibility').textContent = (current.visibility / 1000).toFixed(1);
    
    // Get weather condition from weather code
    const condition = getWeatherCondition(current.weather_code);
    document.getElementById('weather-condition').textContent = condition.text;
    document.getElementById('weather-icon').src = condition.icon;
    
    // Show current weather section
    loadingDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    currentWeatherDiv.style.display = 'block';
    
    // Display forecast
    displayForecast(daily);
}

// Display 5-day forecast
function displayForecast(daily) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';
    
    // Show only next 5 days
    for (let i = 1; i <= 5; i++) {
        const date = new Date(daily.time[i]);
        const condition = getWeatherCondition(daily.weather_code[i]);
        const tempMax = Math.round(daily.temperature_2m_max[i]);
        const tempMin = Math.round(daily.temperature_2m_min[i]);
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="forecast-date">${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <img src="${condition.icon}" alt="${condition.text}" class="forecast-icon">
            <div class="forecast-temp">${tempMax}°C / ${tempMin}°C</div>
            <div class="forecast-condition">${condition.text}</div>
        `;
        
        forecastContainer.appendChild(forecastCard);
    }
    
    forecastSection.style.display = 'block';
}

// Get weather condition from WMO weather code
function getWeatherCondition(code) {
    const conditions = {
        0: { text: 'Clear', icon: '☀️' },
        1: { text: 'Mainly Clear', icon: '🌤️' },
        2: { text: 'Partly Cloudy', icon: '⛅' },
        3: { text: 'Overcast', icon: '☁️' },
        45: { text: 'Foggy', icon: '🌫️' },
        48: { text: 'Depositing Rime Fog', icon: '🌫️' },
        51: { text: 'Light Drizzle', icon: '🌧️' },
        53: { text: 'Moderate Drizzle', icon: '🌧️' },
        55: { text: 'Dense Drizzle', icon: '🌧️' },
        61: { text: 'Slight Rain', icon: '🌧️' },
        63: { text: 'Moderate Rain', icon: '🌧️' },
        65: { text: 'Heavy Rain', icon: '⛈️' },
        71: { text: 'Slight Snow', icon: '❄️' },
        73: { text: 'Moderate Snow', icon: '❄️' },
        75: { text: 'Heavy Snow', icon: '❄️' },
        77: { text: 'Snow Grains', icon: '❄️' },
        80: { text: 'Slight Rain Showers', icon: '🌧️' },
        81: { text: 'Moderate Rain Showers', icon: '🌧️' },
        82: { text: 'Violent Rain Showers', icon: '⛈️' },
        85: { text: 'Slight Snow Showers', icon: '❄️' },
        86: { text: 'Heavy Snow Showers', icon: '❄️' },
        95: { text: 'Thunderstorm', icon: '⛈️' },
        96: { text: 'Thunderstorm with Hail', icon: '⛈️' },
        99: { text: 'Thunderstorm with Heavy Hail', icon: '⛈️' }
    };
    
    return conditions[code] || { text: 'Unknown', icon: '❓' };
}

// Show loading state
function showLoading() {
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    currentWeatherDiv.style.display = 'none';
    forecastSection.style.display = 'none';
}

// Show error state
function showError(message) {
    errorMessage.textContent = message;
    errorDiv.style.display = 'block';
    loadingDiv.style.display = 'none';
    currentWeatherDiv.style.display = 'none';
    forecastSection.style.display = 'none';
}

// Load default weather on page load
window.addEventListener('load', () => {
    // Load weather for a default city
    searchWeather();
});