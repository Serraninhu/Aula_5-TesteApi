// ==========================
// IMPORTA DEPENDÊNCIAS
// ==========================
const express = require('express'); // Framework para criar servidor web
const cors = require("cors");       // Permite requisições externas (CORS)
const axios = require('axios');     // Para fazer requisições HTTP a APIs externas

// ==========================
// CONFIGURAÇÃO DO SERVIDOR
// ==========================
const app = express();
const PORT = 3000;
const apiKey = 'af7b592cc92cbbfd432eb74a719a7ac4'; // Substituir pela sua chave da API

app.use(cors()); // Habilita CORS

// ==========================
// FUNÇÃO AUXILIAR: consulta clima
// ==========================
async function getWeather(city, country = "") {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}${country ? "," + country : ""}&appid=${apiKey}&units=metric&lang=pt_br`;
  const response = await axios.get(url);
  return response.data;
}

// ==========================
// ROTA GET /weather
// ==========================
app.get('/weather', async (req, res) => {
  const { city, country } = req.query;
  if (!city || !country) return res.status(400).json({ error: 'Informe cidade e país.' });

  try {
    const data = await getWeather(city, country);

    const result = {
      temperature: data.main?.temp ?? 0,
      humidity: data.main?.humidity ?? 0,
      windSpeed: data.wind?.speed ? data.wind.speed * 3.6 : 0, // m/s → km/h
      rainChance: data.rain?.['1h'] ?? 0,
      weatherCondition: data.weather?.[0]?.description ?? 'Desconhecido'
    };

    res.json(result);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'Cidade não encontrada.' });
    }
    res.status(500).json({ error: 'Erro ao obter dados do clima.' });
  }
});

// ==========================
// ROTA GET /alert
// ==========================
app.get('/alert', async (req, res) => {
  const { city, country } = req.query;
  if (!city || !country) return res.status(400).json({ error: 'Informe cidade e país.' });

  try {
    const data = await getWeather(city, country);
    const temp = data.main?.temp ?? 0;

    const alert = temp > 30 ? 'Quente' : temp < 10 ? 'Frio' : 'Agradável';

    res.json({ city, temperature: temp, alert });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter dados do clima.' });
  }
});

// ==========================
// ROTA GET /multiple
// ==========================
app.get('/multiple', async (req, res) => {
  const { cities } = req.query;
  if (!cities) return res.status(400).json({ error: 'Informe pelo menos uma cidade.' });

  const cityList = cities.split(',');
  const results = [];

  try {
    for (let city of cityList) {
      const data = await getWeather(city.trim());
      results.push({
        city: city.trim(),
        temperature: data.main?.temp ?? 0,
        weather: data.weather?.[0]?.description ?? 'Desconhecido'
      });
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar API para múltiplas cidades.' });
  }
});

// ==========================
// INICIA O SERVIDOR
// ==========================
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
