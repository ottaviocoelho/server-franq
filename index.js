require('dotenv').config();
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const cors = require('cors')

const app = express();
const cache = new NodeCache({ stdTTL: 9999999 });
const PORT = process.env.PORT || 3000;
const API_URL = 'https://api.hgbrasil.com/finance';
const API_KEY = process.env.API_KEY;

const updateCacheWithLogging = (key, newValue) => {
  const currentValue = cache.get(key);

  if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
    cache.set(key, newValue);

    console.log(`[${new Date().toISOString()}] Cache atualizado para a chave "${key}". Novo valor:`, newValue);
  } else {
    console.log(`[${new Date().toISOString()}] Valor para a chave "${key}" não mudou. Nenhuma atualização no cache.`);
  }
};

// Cache
async function fetchFinanceData() {
    try {
        const response = await axios.get(API_URL, { params: { key: API_KEY } });
        const data = response.data.results;
        updateCacheWithLogging('finance', data)
        console.log('Updated cache: ', new Date().toISOString());
    } catch (error) {
        console.error('Error on retrieving data: ', error.message);
    }
}

setInterval(fetchFinanceData, 60000);
fetchFinanceData();

function sendCachedData(req, res, key) {
  const data = cache.get('finance');
  if (data && data[key]) {
      res.json(data[key]);
  } else {
      res.status(204).send();
  }
}

const allowedOrigins = [
  "http://localhost:3000", // Localhost para desenvolvimento
  process.env.HEROKU_FRONTEND_URL // URL do frontend no Heroku (definida no Heroku)
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Endpoints for client
app.get('/currencies', (req, res) => sendCachedData(req, res, 'currencies'));
app.get('/stocks', (req, res) => sendCachedData(req, res, 'stocks'));
app.get('/bitcoin', (req, res) => sendCachedData(req, res, 'bitcoin'));
app.get('/taxes', (req, res) => sendCachedData(req, res, 'taxes'));

app.listen(PORT, () => {
    console.log(`Server running on: ${PORT}`);
});