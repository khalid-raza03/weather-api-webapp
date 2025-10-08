        const API_KEY = 'b31dccba5d284d088d2184458250710';

        const searchButton = document.getElementById('getWeatherBtn')
        const citySearchInput = document.getElementById('cityInput')
        const weatherDetail = document.getElementById('weatherDetail')

        // Load saved cities on page load
        window.addEventListener('load', loadSavedCities);

        // Event listener for search button
        searchButton.addEventListener('click', async () => {
            const cityName = citySearchInput.value.trim();
            if (!cityName) {
                alert('Please enter a city name.');
                return;
            }

            searchButton.textContent = 'Searching...';
            searchButton.disabled = true;

            const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${cityName}&aqi=yes`;

            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error('City not found');
                }
                const data = await response.json();
                displayWeather(data);
                saveCityData(data);
                citySearchInput.value = ''; // Clear input after successful search
            } catch (error) {
                alert(error.message);
            } finally {
                searchButton.textContent = 'Search Weather';
                searchButton.disabled = false;
            }
        });

        // Function to display weather data
        function displayWeather(data) {
            const { location, current } = data;
            const cityCard = document.createElement('div');
            cityCard.className = 'col-md-4 col-sm-6';
            cityCard.innerHTML = `
                <div class="card h-auto text-center bg-info-subtle rounded-4 border-info ">
                    <div class="card-body d-flex flex-column gap-2 align-items-center position-relative">
                       
                        <img src="${current.condition.icon}" alt="weather icon" class="img-fluid">
                        <p class="card-text mb-1"><b>${current.temp_c}°C</b></p>
                        <h3 class="card-title fw-bold">${location.name}</h5>
                        <small class="text-muted">${location.country}</small>
                         <p class="d-flex flex-column gap-1 align-items-start bg-light-subtle rounded-3 py-2 px-5"> 
                                                    <small class="text-info">(${current.condition.text}  Weather)</small>
                      <span class="text-body-secondary fst-italic"><b> Last Updated on :</b>${current.last_updated}</span>
                     <span class="text-body-secondary fst-italic"><b> Wind Speed :</b> (kph)${current.wind_kph} </span>
                            </p>
                             <button class="btn btn-sm btn-primary m-2 rounded-3   px-4 py-2" onclick="refreshCity('${location.name}', this)">Refresh</button>
                    </div>
                </div>
            `;
            weatherDetail.appendChild(cityCard);
        }

        // Save city data to localStorage
        function saveCityData(data) {
            const savedCities = JSON.parse(localStorage.getItem('weatherCities') || '[]');
            const cityExists = savedCities.find(city => city.location.name === data.location.name);
            if (!cityExists) {
                savedCities.push(data);
                localStorage.setItem('weatherCities', JSON.stringify(savedCities));
            }
        }

        function loadSavedCities() {
            const savedCities = JSON.parse(localStorage.getItem('weatherCities') || '[]');
            savedCities.forEach(cityData => displayWeather(cityData));
        }

        // Refresh individual city data
        async function refreshCity(cityName, button) {
            button.textContent = '⏳';
            button.disabled = true;

            const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${cityName}&aqi=yes`;

            try {
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('Failed to refresh');

                const data = await response.json();

                // Update localStorage
                const savedCities = JSON.parse(localStorage.getItem('weatherCities') || '[]');
                const cityIndex = savedCities.findIndex(city => city.location.name === cityName);
                if (cityIndex !== -1) {
                    savedCities[cityIndex] = data;
                    localStorage.setItem('weatherCities', JSON.stringify(savedCities));
                }

                // Remove old card and add updated one
                const cardElement = button.closest('.col-md-4');
                cardElement.remove();
                displayWeather(data);

            } catch (error) {
                alert('Failed to refresh weather data');
            } finally {
                button.textContent = '🔄';
                button.disabled = false;
            }
        }

    