---
name: weather
description: Get current weather and 7-day forecast for any location worldwide using Open-Meteo API (no API key required)
location: ~/.clippy/skills/weather
version: 1.0.0
author: Clippy
categories: utilities, information
keywords: weather, forecast, temperature, rain, sun, climate
enabledByDefault: true
---

# Weather Skill

Get current weather conditions and forecasts for any location worldwide.

## Usage

Use the following commands in chat:

- `/weather <city>` — Get current weather
- `/forecast <city>` — Get 7-day forecast

## Actions

### get_weather

Get current weather and 7-day forecast for a location.

```json
{
  "properties": {
    "location": {
      "type": "string",
      "description": "City name or location (e.g., 'Bangkok', 'Tokyo', 'New York')"
    },
    "show_forecast": {
      "type": "boolean",
      "description": "Whether to include 7-day forecast (default: true)"
    }
  },
  "required": ["location"]
}
```

Risk level: low

## Examples

```
/weather Bangkok
/forecast Tokyo
/weather "New York"