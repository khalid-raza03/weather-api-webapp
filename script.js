const API_KEY = 'b31dccba5d284d088d2184458250710';
const $ = id => document.getElementById(id);
const searchBtn = $('getWeatherBtn'), cityInput = $('cityInput'), weatherBox = $('weatherDetail');

window.addEventListener('load', loadSavedCities);
searchBtn.addEventListener('click', handleSearch);

async function handleSearch() {
  const city = cityInput.value.trim();
  if (!city) return alert('Please enter a city name.');

  toggleButton(searchBtn, true, 'Searching...');
  try {
    const data = await fetchWeather(city);
    displayWeather(data);
    saveCity(data);
    cityInput.value = '';
  } catch (e) {
    alert(e.message);
  } finally {
    toggleButton(searchBtn, false, 'Search Weather');
  }
}

async function fetchWeather(city) {
  const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}&aqi=yes`);
  if (!res.ok) throw new Error('City not found');
  return res.json();
}

function displayWeather({ location, current }) {
  const card = document.createElement('div');
  card.className = 'col-lg-4 col-sm-6';
  card.innerHTML = `
    <div class="card h-auto text-center bg-info-subtle rounded-4 border-info">
      <div class="card-body d-flex flex-column gap-2 align-items-center position-relative">
        <img src="${current.condition.icon}" alt="weather icon" class="img-fluid">
        <p class="card-text mb-1"><b>${current.temp_c}°C</b></p>
        <h3 class="card-title fw-bold">${location.name}</h3>
        <small class="text-muted">${location.country}</small>
        <p class="d-flex flex-column gap-1 align-items-start bg-light-subtle rounded-3 py-2 px-4 px-sm-3"> 
          <small class="text-info">(${current.condition.text} Weather)</small>
          <span class="text-body-secondary fst-italic text3"><b>Last Updated:</b> ${current.last_updated}</span>
          <span class="text-body-secondary fst-italic text3"><b>Wind Speed:</b> ${current.wind_kph} kph</span>
        </p>
        <div class="d-flex gap-2">
        <button class="btn btn-sm btn-primary m-2 rounded-3 px-4 py-2" onclick="refreshCity('${location.name}', this)">Refresh</button>
        <button class="btn btn-sm btn-danger m-2 rounded-3 px-4 py-2" onclick="deleteCity('${location.name}', this), this">Remove</button>
        </div>
      </div>
    </div>`;
  weatherBox.appendChild(card);
}

function saveCity(data) {
  const cities = JSON.parse(localStorage.getItem('weatherCities') || '[]');
  if (!cities.some(c => c.location.name === data.location.name)) {
    cities.push(data);
    localStorage.setItem('weatherCities', JSON.stringify(cities));
  }
}

function loadSavedCities() {
  JSON.parse(localStorage.getItem('weatherCities') || '[]').forEach(displayWeather);
}

async function refreshCity(name, btn) {
  toggleButton(btn, true, '⏳');
  try {
    const data = await fetchWeather(name);
    const cities = JSON.parse(localStorage.getItem('weatherCities') || '[]');
    const idx = cities.findIndex(c => c.location.name === name);
    if (idx !== -1) {
      cities[idx] = data;
      localStorage.setItem('weatherCities', JSON.stringify(cities));
    }
    btn.closest('.col-lg-4, .col-sm-6')?.remove();
    displayWeather(data);
  } catch {
    alert('Failed to refresh weather data');
  } finally {
    toggleButton(btn, false, '🔄');
  }
}

function toggleButton(btn, disabled, text) {
  btn.disabled = disabled;
  btn.textContent = text;
}

function deleteCity(name, btn) {
    // Remove from localStorage
    const cities = JSON.parse(localStorage.getItem('weatherCities') || '[]');
    const filteredCities = cities.filter(c => c.location.name !== name);
    localStorage.setItem('weatherCities', JSON.stringify(filteredCities));
    
    // Remove from DOM
    btn.closest('.col-lg-4')?.remove();
}