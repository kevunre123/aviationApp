// js/app.js

// I grab references to all the DOM elements I’ll interact with
const icaoInput    = document.getElementById('icao-input');
const searchBtn    = document.getElementById('search-btn');
const metarInfo    = document.getElementById('metar-info');
const stationEl    = document.getElementById('station');
const tempEl       = document.getElementById('temperature');
const windEl       = document.getElementById('wind');
const visibilityEl = document.getElementById('visibility');
const cloudsEl     = document.getElementById('clouds');
const pressureEl   = document.getElementById('pressure');
const humidityEl   = document.getElementById('humidity');
const messageEl    = document.getElementById('message');

// I store my AVWX API key here 
const AVWX_API_KEY = 'cnoKkSKuejdRUJkZuykCdfPpFN7xtSCdElEVzYeco3o';

/**
 * I convert wind angles into compass directions like N, NE, E, etc.
 * This helps make the wind data more intuitive to read.
 */
function degToCompass(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

/**
 * I fetch the station metadata for a given ICAO code
 * This gives me the full airport name even if the METAR doesn’t include it
 */
async function getStationName(icao) {
  const url = `https://avwx.rest/api/station/${icao}`;
  const headers = { Authorization: `Bearer ${AVWX_API_KEY}` };

  try {
    const resp = await fetch(url, { headers });
    if (!resp.ok) return 'Unknown';

    const data = await resp.json();
    return data.name ?? 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/**
 * I fetch the METAR weather data from AVWX and display it to the user
 */
async function getMetar(icao) {
  // I reset the UI before fetching
  messageEl.textContent = '';
  metarInfo.classList.add('hidden');
  messageEl.textContent = '🔄 Fetching METAR...';

  try {
    // I prepare the METAR request
    const url = `https://avwx.rest/api/metar/${icao}?format=json`;
    const headers = { Authorization: `Bearer ${AVWX_API_KEY}` };

    // I send the request and get the response
    const resp = await fetch(url, { headers });

    // I check for valid response status
    if (!resp.ok) throw new Error(`API error (${resp.status})`);

    // I grab the raw text and check if it’s empty
    const rawText = await resp.text();
    if (!rawText || rawText.trim() === '') {
      throw new Error(`No METAR data found for ${icao}`);
    }

    // I parse the response into JSON
    const data = JSON.parse(rawText);
    console.log('METAR data:', data);

    // I also fetch the station name separately
    const name = await getStationName(icao);

    // I extract key weather values from the METAR data
    const windSpeed  = data.wind_speed?.value;
    const windDir    = data.wind_direction?.value;
    const pressure   = data.altimeter?.value;
    const temp       = data.temperature?.value;
    const visibility = data.visibility?.value;
    const humidity   = data.relative_humidity?.value ?? 'N/A';
    const clouds     = data.clouds?.map(c => `${c.type} at ${c.base_ft_agl} ft`).join(', ') || 'None';

    // I update the UI with the fetched data
    stationEl.textContent    = `${icao.toUpperCase()} – ${name}`;
    tempEl.textContent       = temp !== null ? temp.toFixed(1) : 'N/A';
    windEl.textContent       = windSpeed !== null && windDir !== null
      ? `${windSpeed.toFixed(1)} kt (${windDir}° ${degToCompass(windDir)})`
      : 'N/A';
    visibilityEl.textContent = visibility !== null ? `${visibility.toFixed(1)} sm` : 'N/A';
    cloudsEl.textContent     = clouds;
    pressureEl.textContent   = pressure !== null ? `${pressure.toFixed(1)}` : 'N/A';
    humidityEl.textContent   = humidity;

    // I reveal the results and clear the message
    metarInfo.classList.remove('hidden');
    messageEl.textContent = '';

  } catch (err) {
    // I show an error message in the UI and log it for debugging
    messageEl.textContent = '❌ ' + err.message;
    console.error('Fetch error:', err);
  }
}

/**
 * I activate the search when the user clicks the Search button
 */
searchBtn.addEventListener('click', () => {
  const icao = icaoInput.value.trim().toUpperCase();

  // I validate that the ICAO code is 4 characters
  if (!icao || icao.length !== 4) {
    messageEl.textContent = 'Please enter a valid ICAO code (e.g. EGLL)';
    return;
  }

  // I fetch and display the METAR data for the given code
  getMetar(icao);
});

/**
 * I also allow the user to press Enter to search
 */
icaoInput.addEventListener('keyup', e => {
  if (e.key === 'Enter') searchBtn.click();
});