const API_KEY = "b31dccba5d284d088d2184458250710";
const STORAGE_KEY = "weatherCities";

const $ = (id) => document.getElementById(id);
const searchBtn = $("getWeatherBtn");
const cityInput = $("cityInput");
const weatherBox = $("weatherDetail");
const root = document.documentElement;
const searchInput = $("cityInput");

const weatherState = {
  sort: "recent",
  weather: [],
};

function toggleButton(btn, disabled, text) {
  if (!btn) return;
  btn.disabled = disabled;
  btn.textContent = text;
}

function readSavedCities() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(saved || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedCities(cities) {
  weatherState.weather = cities;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
  } catch {
    // Storage can be unavailable in some browser modes, so keep the UI working.
  }
}

function cityKey(name) {
  return String(name || "").trim().toLowerCase();
}

function getRainValue(current) {
  return current.chance_of_rain ?? current.precip_mm ?? 0;
}

async function fetchWeather(city) {
  const res = await fetch(
    `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(city)}&aqi=yes`,
  );

  if (!res.ok) {
    throw new Error("City not found");
  }

  return res.json();
}

function updateFallbackVisibility(hasWeather) {
  const fallbackTxt = $("fallbackTxt");
  if (fallbackTxt) {
    fallbackTxt.style.display = hasWeather ? "none" : "inline-block";
  }
}

function createWeatherCard({ location, current }) {
  const card = document.createElement("div");
  card.className = "weather-card w-full";

  card.innerHTML = `
    <div class=" bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex flex-col items-center relative transition-all duration-300 hover:scale-[1.02] hover:bg-white/15 hover:shadow-xl hover:shadow-blue-500/10">
      <img src="${current.condition.icon}" alt="weather icon" class="w-20 h-20 drop-shadow-md">
      <p class="text-4xl font-extrabold mt-2 text-white">${current.temp_c}&deg;C</p>
      <h3 class="text-2xl font-bold mt-1 text-blue-600">${location.name}</h3>
      <small class="text-gray-300 text-sm">${location.country}</small>

      <div class="w-full mt-4 p-4 rounded-xl bg-black/20 flex flex-col gap-2 text-left text-sm border border-white/5">
        <span class="text-blue-300 font-semibold text-center border-b border-white/5 pb-1">${current.condition.text} </span>
        <span class="text-gray-300"><b>Last Live Updated :</b> ${current.last_updated}</span>
        <span class="text-gray-300"><b>Rain Value:</b> ${getRainValue(current)}%</span>
      </div>

      <div class="flex gap-3 mt-6 w-full">
        <button type="button" data-action="refresh" data-city="${encodeURIComponent(location.name)}" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200">Update</button>
        <button type="button" data-action="delete" data-city="${encodeURIComponent(location.name)}" class="flex-1 bg-red-600/80 hover:bg-red-500 text-white rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200">Remove</button>
      </div>
    </div>`;

    
  return card;
}

function sortWeatherData(data) {
  switch (weatherState.sort) {
    case "recent":
            return data;
    case "temp":
      return [...data].sort((a, b) => b.current.temp_c - a.current.temp_c);
    case "rain":
      return [...data].sort((a, b) => getRainValue(b.current) - getRainValue(a.current));
    case "name":
      return [...data].sort((a, b) => a.location.name.localeCompare(b.location.name));
    default:
      return data;
  }
}

function renderWeather() {
  if (!weatherBox) return;

  const data = sortWeatherData([...weatherState.weather]);
  weatherBox.querySelectorAll(".weather-card").forEach((card) => card.remove());

  if (!data.length) {
    updateFallbackVisibility(false);
    return;
  }

  updateFallbackVisibility(true);
  data.forEach((item) => weatherBox.appendChild(createWeatherCard(item)));
}

function saveCity(data) {
  const cities = readSavedCities();
  const idx = cities.findIndex(
    (city) => cityKey(city.location?.name) === cityKey(data.location?.name),
  );

  if (idx === -1) {
    cities.push(data);
  } else {
    cities[idx] = data;
  }

  writeSavedCities(cities);
  renderWeather();
}

function loadSavedCities() {
  weatherState.weather = readSavedCities();
  renderWeather();
}

function deleteCity(name) {
  const filtered = readSavedCities().filter(
    (city) => cityKey(city.location?.name) !== cityKey(name),
  );

  writeSavedCities(filtered);
  renderWeather();
}

async function refreshCity(name, btn) {

    toggleButton(btn, true, "Updating...");

    try {

        const data = await fetchWeather(name);

        let cities = readSavedCities();

        // Remove old entry
        cities = cities.filter(
            city => cityKey(city.location?.name) !== cityKey(name)
        );

        // Put refreshed city at beginning
        cities.unshift(data);

        writeSavedCities(cities);

        renderWeather();

    } catch (e) {

        console.error(e);

        alert("Failed to refresh weather data");

    } 

}

async function handleSearch() {
  const city = cityInput?.value.trim();
  if (!city) return alert("Please enter a city name.");

  toggleButton(searchBtn, true, "Searching...");

  try {
    const data = await fetchWeather(city);
    saveCity(data);
    cityInput.value = "";
  } catch (e) {
    alert(e.message);
  } finally {
    toggleButton(searchBtn, false, "Show Weather");
  }
}


// general search feature with debounce effect
function debounce(callback, delay = 400) {
    let timer;

    return function (...args) {
        clearTimeout(timer);

        timer = setTimeout(() => {
            callback.apply(this, args);
        }, delay);
    };
}

function searchWeatherCards() {
    const keyword = searchInput.value.trim().toLowerCase();

    document.querySelectorAll(".weather-card").forEach(card => {
        card.style.display = card.textContent
            .toLowerCase()
            .includes(keyword)
            ? ""
            : "none";
    });
}

searchInput.addEventListener(
    "input",
    debounce(searchWeatherCards, 400)
);
 

function changeTheme() {
  const lightIcon = $("lightIcon");
  const darkIcon = $("darkIcon");
  const isDark = root.classList.toggle("dark");

  if (isDark) {
    darkIcon?.classList.remove("hidden");
    lightIcon?.classList.add("hidden");
    root.style.setProperty("--bg-main", "var(--bg-main-dark)");
  } else {
    darkIcon?.classList.add("hidden");
    lightIcon?.classList.remove("hidden");
    root.style.setProperty("--bg-main", "var(--bg-main-light)");
  }
}

window.addEventListener("load", () => {
  const preloader = $("preloader");
  const mainContent = $("main");

  preloader?.classList.add("opacity-0", "pointer-events-none");
  mainContent?.classList.remove("opacity-0");
  mainContent?.classList.add("opacity-100");

  setTimeout(() => {
    preloader?.remove();
  }, 2000);
});

window.addEventListener("load", loadSavedCities);

const sortOptions = document.querySelectorAll("[data-option][data-sort]");
sortOptions.forEach((option) => {
  option.addEventListener("click", (e) => {
    e.preventDefault();
    const dropdown = option.closest("[data-dropdown]");
    const title = dropdown?.querySelector("[data-title]");

    if (title) {
      title.textContent = option.textContent.trim();
    }

    weatherState.sort = option.dataset.sort || "";
    renderWeather();
  });
});

weatherBox?.addEventListener("click", (e) => {
  const button = e.target.closest("button[data-action]");
  if (!button || !weatherBox.contains(button)) return;

  const action = button.dataset.action;
  const city = decodeURIComponent(button.dataset.city || "");

  if (action === "refresh") {
    refreshCity(city, button);
  }

  if (action === "delete") {
    deleteCity(city);
  }
});

const goToTop = $("goToTop");

window.addEventListener("scroll", () => {
  if (!goToTop) return;

  if (window.scrollY > 300) {
    goToTop.classList.remove("hidden");
  } else {
    goToTop.classList.add("hidden");
  }
});

searchBtn?.addEventListener("click", handleSearch);
cityInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleSearch();
  }
});

