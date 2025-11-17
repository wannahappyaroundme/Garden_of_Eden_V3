/**
 * Weather Plugin for Garden of Eden V3
 *
 * Provides current weather information for any city using OpenWeatherMap API.
 * This is an example plugin demonstrating the plugin system capabilities.
 */

/**
 * Get current weather for a city
 * @param {string} city - City name (e.g., "Seoul", "New York")
 * @param {string} units - Temperature units ("metric" or "imperial")
 * @returns {Promise<Object>} Weather data
 */
async function getCurrentWeather(city, units = "metric") {
  // Note: In production, API key should be configured by user in plugin settings
  // This is a demo API key (replace with actual key)
  const API_KEY = "demo_api_key_replace_with_real_key";

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Format weather data
    return {
      success: true,
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      cloudiness: data.clouds.all,
      units: units === "metric" ? "°C" : "°F",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      city: city
    };
  }
}

/**
 * Get weather forecast for a city (5 day / 3 hour)
 * @param {string} city - City name
 * @param {string} units - Temperature units
 * @returns {Promise<Object>} Forecast data
 */
async function getWeatherForecast(city, units = "metric") {
  const API_KEY = "demo_api_key_replace_with_real_key";

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Format forecast data (next 24 hours, every 3 hours)
    const forecast = data.list.slice(0, 8).map(item => ({
      time: new Date(item.dt * 1000).toLocaleString(),
      temperature: Math.round(item.main.temp),
      description: item.weather[0].description,
      humidity: item.main.humidity,
      windSpeed: item.wind.speed
    }));

    return {
      success: true,
      city: data.city.name,
      country: data.city.country,
      forecast: forecast,
      units: units === "metric" ? "°C" : "°F"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      city: city
    };
  }
}

/**
 * Format weather data as human-readable string
 * @param {Object} weatherData - Weather data from getCurrentWeather()
 * @returns {string} Formatted weather description
 */
function formatWeatherString(weatherData) {
  if (!weatherData.success) {
    return `날씨 정보를 가져올 수 없습니다: ${weatherData.error}`;
  }

  return `📍 ${weatherData.city}, ${weatherData.country}
🌡️ 현재 온도: ${weatherData.temperature}${weatherData.units} (체감: ${weatherData.feelsLike}${weatherData.units})
☁️ 날씨: ${weatherData.description}
💧 습도: ${weatherData.humidity}%
💨 풍속: ${weatherData.windSpeed} m/s
☁️ 구름: ${weatherData.cloudiness}%`;
}

// Export plugin functions
// These will be available to Garden of Eden V3 through the plugin API
module.exports = {
  getCurrentWeather,
  getWeatherForecast,
  formatWeatherString,

  // Plugin metadata (optional, duplicates manifest.json)
  meta: {
    name: "Weather Plugin",
    version: "1.0.0",
    description: "Get current weather information for any city"
  }
};
