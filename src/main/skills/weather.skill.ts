/**
 * Weather Skill - Provides weather information using Open-Meteo API
 *
 * This skill fetches current weather and forecasts for any location.
 * Uses Open-Meteo free API (no API key required).
 */

import type { Skill, SkillContext, SkillResult } from "./types";

interface GeoResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

const WEATHER_CODES: Record<number, { emoji: string; description: string }> = {
  0: { emoji: "☀️", description: "Clear sky" },
  1: { emoji: "🌤️", description: "Mainly clear" },
  2: { emoji: "⛅", description: "Partly cloudy" },
  3: { emoji: "☁️", description: "Overcast" },
  45: { emoji: "🌫️", description: "Foggy" },
  48: { emoji: "🌫️", description: "Depositing rime fog" },
  51: { emoji: "🌧️", description: "Light drizzle" },
  53: { emoji: "🌧️", description: "Moderate drizzle" },
  55: { emoji: "🌧️", description: "Dense drizzle" },
  56: { emoji: "🌧️", description: "Light freezing drizzle" },
  57: { emoji: "🌧️", description: "Dense freezing drizzle" },
  61: { emoji: "🌧️", description: "Slight rain" },
  63: { emoji: "🌧️", description: "Moderate rain" },
  65: { emoji: "🌧️", description: "Heavy rain" },
  66: { emoji: "🌧️", description: "Light freezing rain" },
  67: { emoji: "🌧️", description: "Heavy freezing rain" },
  71: { emoji: "🌨️", description: "Slight snow fall" },
  73: { emoji: "🌨️", description: "Moderate snow fall" },
  75: { emoji: "❄️", description: "Heavy snow fall" },
  77: { emoji: "🌨️", description: "Snow grains" },
  80: { emoji: "🌦️", description: "Slight rain showers" },
  81: { emoji: "🌦️", description: "Moderate rain showers" },
  82: { emoji: "⛈️", description: "Violent rain showers" },
  85: { emoji: "🌨️", description: "Slight snow showers" },
  86: { emoji: "🌨️", description: "Heavy snow showers" },
  95: { emoji: "⛈️", description: "Thunderstorm" },
  96: { emoji: "⛈️", description: "Thunderstorm with slight hail" },
  99: { emoji: "⛈️", description: "Thunderstorm with heavy hail" },
};

function getWeatherEmoji(code: number): string {
  return WEATHER_CODES[code]?.emoji || "🌡️";
}

function getWeatherDescription(code: number): string {
  return WEATHER_CODES[code]?.description || "Unknown";
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

async function geocodeLocation(query: string): Promise<GeoResult | null> {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
  );

  if (!response.ok) return null;

  const data = await response.json();
  if (!data.results || data.results.length === 0) return null;

  const result = data.results[0];
  return {
    name: result.name,
    country: result.country || "",
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

async function getWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherData | null> {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`,
  );

  if (!response.ok) return null;
  return response.json();
}

function formatCurrentWeather(geo: GeoResult, weather: WeatherData): string {
  const current = weather.current;
  const emoji = getWeatherEmoji(current.weather_code);
  const desc = getWeatherDescription(current.weather_code);

  return [
    `${emoji} Weather in ${geo.name}, ${geo.country}`,
    ``,
    `${desc}`,
    `🌡️ Temperature: ${current.temperature_2m}°C (feels like ${current.apparent_temperature}°C)`,
    `💧 Humidity: ${current.relative_humidity_2m}%`,
    `💨 Wind: ${current.wind_speed_10m} km/h`,
    `🌧️ Precipitation: ${current.precipitation} mm`,
  ].join("\n");
}

function formatForecast(weather: WeatherData): string {
  const lines: string[] = ["", "📅 7-Day Forecast:", ""];

  for (let i = 0; i < Math.min(7, weather.daily.time.length); i++) {
    const day = getDayName(weather.daily.time[i]);
    const emoji = getWeatherEmoji(weather.daily.weather_code[i]);
    const maxTemp = Math.round(weather.daily.temperature_2m_max[i]);
    const minTemp = Math.round(weather.daily.temperature_2m_min[i]);
    const precip = weather.daily.precipitation_sum[i];

    lines.push(
      `${day}: ${emoji} ${minTemp}° ~ ${maxTemp}° ${precip > 0 ? `(${precip}mm)` : ""}`,
    );
  }

  return lines.join("\n");
}

export function createWeatherSkill(): Skill {
  return {
    meta: {
      id: "weather",
      name: "Weather",
      version: "1.0.0",
      description:
        "Get current weather and forecasts for any location worldwide. Uses free Open-Meteo API.",
      author: "Clippy",
      categories: ["utilities", "information"],
      keywords: ["weather", "forecast", "temperature", "rain", "sun"],
      enabledByDefault: true,
    },

    actions: {
      get_weather: {
        meta: {
          name: "get_weather",
          description:
            'Get current weather and 7-day forecast for a location. Example: "weather in Bangkok", "what\'s the weather like in Tokyo?"',
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description:
                  "City name or location (e.g., 'Bangkok', 'New York', 'Tokyo')",
              },
              show_forecast: {
                type: "boolean",
                description:
                  "Whether to include 7-day forecast (default: true)",
              },
            },
            required: ["location"],
          },
          riskLevel: "low",
        },
        execute: async (
          args: Record<string, unknown>,
          _context: SkillContext,
        ): Promise<SkillResult> => {
          const location = String(args.location || "").trim();
          const showForecast = args.show_forecast !== false;

          if (!location) {
            return {
              success: false,
              error: "Please provide a location (e.g., 'Bangkok', 'Tokyo')",
            };
          }

          try {
            const geo = await geocodeLocation(location);
            if (!geo) {
              return {
                success: false,
                error: `Could not find location: "${location}". Please try a different city name.`,
              };
            }

            const weather = await getWeather(geo.latitude, geo.longitude);
            if (!weather) {
              return {
                success: false,
                error: "Failed to fetch weather data. Please try again.",
              };
            }

            let output = formatCurrentWeather(geo, weather);

            if (showForecast) {
              output += "\n" + formatForecast(weather);
            }

            return {
              success: true,
              output,
              data: {
                location: geo.name,
                country: geo.country,
                temperature: weather.current.temperature_2m,
                humidity: weather.current.relative_humidity_2m,
                weatherCode: weather.current.weather_code,
              },
            };
          } catch (error) {
            return {
              success: false,
              error: `Weather fetch failed: ${error}`,
            };
          }
        },
      },
    },

    async init(_context: SkillContext) {
      console.log("[Weather Skill] Initialized");
    },
  };
}
