//weather
const weatherApiKey = config.weatherapiKey;

const getWeather = async (city) => {
  const encodedCity = encodeURIComponent(city);
  const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&units=metric&lang=kr&appid=${weatherApiKey}`;
  try {
    const response = await fetch(weatherApiUrl);
    if (!response.ok) {
      throw new Error("날씨 정보를 가져오는 중에 오류가 발생했습니다.");
    }
    const data = await response.json();
    displayWeather(data);
    console.log(data);
  } catch (error) {
    console.error(
      "날씨 정보를 가져오는 동안 문제가 발생했습니다. 문제 내용은 다음과 같습니다. ",
      error.message
    );
  }
};

const displayWeather = (data) => {
  const weatherDiv = document.getElementById("weather");
  const weatherDescription = data.weather[0].description;
  const temperature = data.main.temp;
  const city = data.name;

  weatherDiv.innerHTML = `
        <p>도시 : ${city}</p>
        <p>날씨 : ${weatherDescription}</p>
        <p>온도 : ${temperature}℃</p>
        `;
};

document.getElementById("search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const city = document.getElementById("city-input").value;
  getWeather(city);
});
