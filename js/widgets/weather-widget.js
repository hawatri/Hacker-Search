// Weather widget functionality
import { Utils } from '../utils.js';

export class WeatherWidget {
    constructor() {
        this.location = this.loadLocation();
        this.weatherData = null;
        this.updateInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateWeather();
        this.startAutoUpdate();
    }

    setupEventListeners() {
        // Listen for location changes from settings
        window.addEventListener('weatherLocationChanged', (e) => {
            this.location = e.detail.location;
            this.saveLocation();
            this.updateWeather();
        });
    }

    async updateWeather() {
        const weatherInfo = document.getElementById('weatherInfo');
        if (!weatherInfo) return;

        if (!this.location) {
            weatherInfo.innerHTML = 'Location not set. Configure in settings.';
            return;
        }

        weatherInfo.innerHTML = 'Loading weather...';

        try {
            // First get coordinates for the location
            const geoData = await this.getCoordinates(this.location);
            if (!geoData) {
                throw new Error('Location not found');
            }

            // Then get weather data
            const weather = await this.getWeatherData(geoData.lat, geoData.lon);
            this.weatherData = weather;
            this.renderWeather(weather, geoData.name);
        } catch (error) {
            console.error('Weather update failed:', error);
            weatherInfo.innerHTML = `Weather unavailable: ${error.message}`;
        }
    }

    async getCoordinates(location) {
        try {
            const response = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
            );
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                return {
                    lat: result.latitude,
                    lon: result.longitude,
                    name: result.name,
                    country: result.country
                };
            }
            return null;
        } catch (error) {
            console.error('Geocoding failed:', error);
            return null;
        }
    }

    async getWeatherData(lat, lon) {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`
        );
        
        if (!response.ok) {
            throw new Error('Weather service unavailable');
        }
        
        return await response.json();
    }

    renderWeather(data, locationName) {
        const weatherInfo = document.getElementById('weatherInfo');
        if (!weatherInfo || !data.current_weather) return;

        const current = data.current_weather;
        const temp = Math.round(current.temperature);
        const windSpeed = Math.round(current.windspeed);
        
        // Get weather description based on weather code
        const description = this.getWeatherDescription(current.weathercode);
        const icon = this.getWeatherIcon(current.weathercode);

        weatherInfo.innerHTML = `
            <div class="weather-location">${locationName}</div>
            <div class="weather-main">
                <span class="weather-icon">${icon}</span>
                <span class="weather-temp">${temp}°C</span>
            </div>
            <div class="weather-details">
                <div>${description}</div>
                <div>Wind: ${windSpeed} km/h</div>
            </div>
            <div class="weather-updated">
                Updated: ${new Date().toLocaleTimeString()}
            </div>
        `;
    }

    getWeatherDescription(code) {
        const descriptions = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            71: 'Slight snow',
            73: 'Moderate snow',
            75: 'Heavy snow',
            95: 'Thunderstorm',
            96: 'Thunderstorm with hail',
            99: 'Thunderstorm with heavy hail'
        };
        return descriptions[code] || 'Unknown';
    }

    getWeatherIcon(code) {
        const icons = {
            0: '☀️',
            1: '🌤️',
            2: '⛅',
            3: '☁️',
            45: '🌫️',
            48: '🌫️',
            51: '🌦️',
            53: '🌦️',
            55: '🌦️',
            61: '🌧️',
            63: '🌧️',
            65: '🌧️',
            71: '🌨️',
            73: '🌨️',
            75: '❄️',
            95: '⛈️',
            96: '⛈️',
            99: '⛈️'
        };
        return icons[code] || '🌡️';
    }

    startAutoUpdate() {
        // Update weather every 30 minutes
        this.updateInterval = setInterval(() => {
            this.updateWeather();
        }, 30 * 60 * 1000);
    }

    setLocation(location) {
        this.location = location;
        this.saveLocation();
        this.updateWeather();
    }

    loadLocation() {
        return localStorage.getItem('weatherLocation') || '';
    }

    saveLocation() {
        localStorage.setItem('weatherLocation', this.location);
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}