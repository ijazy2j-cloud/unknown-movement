import { useState, useEffect } from 'react';

const WX_MAP = {
  0: { label: 'Clear sky', icon: 'sun' },
  1: { label: 'Mainly clear', icon: 'sun' },
  2: { label: 'Partly cloudy', icon: 'cloud' },
  3: { label: 'Overcast', icon: 'cloud' },
  45: { label: 'Foggy', icon: 'cloud' },
  48: { label: 'Icy fog', icon: 'cloud' },
  51: { label: 'Light drizzle', icon: 'rain' },
  53: { label: 'Drizzle', icon: 'rain' },
  55: { label: 'Heavy drizzle', icon: 'rain' },
  61: { label: 'Light rain', icon: 'rain' },
  63: { label: 'Rain', icon: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain' },
  80: { label: 'Rain showers', icon: 'rain' },
  81: { label: 'Showers', icon: 'rain' },
  82: { label: 'Heavy showers', icon: 'rain' },
  95: { label: 'Thunderstorm', icon: 'storm' },
  96: { label: 'Thunderstorm', icon: 'storm' },
  99: { label: 'Thunderstorm', icon: 'storm' },
};

function getWx(code) {
  return WX_MAP[code] || WX_MAP[Math.floor(code / 10) * 10] || { label: 'Variable', icon: 'cloud' };
}

function WxIcon({ icon, size = 26 }) {
  if (icon === 'sun') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="5"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="5" y2="12"/>
      <line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="4.93" x2="7.05" y2="7.05"/>
      <line x1="16.95" y1="16.95" x2="19.07" y2="19.07"/>
      <line x1="4.93" y1="19.07" x2="7.05" y2="16.95"/>
      <line x1="16.95" y1="7.05" x2="19.07" y2="4.93"/>
    </svg>
  );
  if (icon === 'rain') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/>
      <line x1="8" y1="19" x2="8" y2="21"/>
      <line x1="8" y1="13" x2="8" y2="15"/>
      <line x1="16" y1="19" x2="16" y2="21"/>
      <line x1="16" y1="13" x2="16" y2="15"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="12" y1="15" x2="12" y2="17"/>
    </svg>
  );
  if (icon === 'storm') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/>
      <polyline points="13 11 9 17 15 17 11 23"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  );
}

function formatSunrise(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const WX_ICON_COLORS = {
  sun: 'oklch(76% 0.15 80)',
  rain: 'oklch(62% 0.10 220)',
  storm: 'oklch(58% 0.10 290)',
  cloud: 'var(--um-text-3)',
};

export default function WeatherWidget({ lat, lng, date }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lat || !lng || !date) { setLoading(false); return; }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise&timezone=Asia%2FColombo&forecast_days=7`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const idx = data.daily.time.indexOf(date);
        if (idx !== -1) {
          setWeather({
            code:     data.daily.weathercode[idx],
            tempMax:  Math.round(data.daily.temperature_2m_max[idx]),
            tempMin:  Math.round(data.daily.temperature_2m_min[idx]),
            rainProb: data.daily.precipitation_probability_max[idx],
            sunrise:  data.daily.sunrise[idx],
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lat, lng, date]);

  if (loading) {
    return (
      <div className="um-weather-skeleton">
        <div className="um-skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="um-skeleton" style={{ width: '55%', height: 14, borderRadius: 4 }} />
          <div className="um-skeleton" style={{ width: '75%', height: 12, borderRadius: 3 }} />
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const wx = getWx(weather.code);

  return (
    <div className="um-weather">
      <div className="um-weather-icon" style={{ color: WX_ICON_COLORS[wx.icon] }}>
        <WxIcon icon={wx.icon} size={28} />
      </div>
      <div className="um-weather-body">
        <div className="um-weather-label">{wx.label}</div>
        <div className="um-weather-meta">
          <span className="um-weather-temp">{weather.tempMin}–{weather.tempMax}°C</span>
          {weather.rainProb > 0 && (
            <span className="um-weather-detail"> · {weather.rainProb}% rain</span>
          )}
          {weather.sunrise && (
            <span className="um-weather-detail"> · sunrise {formatSunrise(weather.sunrise)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
