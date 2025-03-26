require('dotenv').config();
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 60 });
const PORT = process.env.PORT || 3000;
const API_URL = 'https://api.hgbrasil.com/finance';
const API_KEY = process.env.API_KEY;

// Cache
async function fetchFinanceData() {
    try {
        const response = await axios.get(API_URL, { params: { key: API_KEY } });
        const data = response.data.results;
        cache.set('finance', data);
        console.log('Updated cache: ', new Date().toISOString());
    } catch (error) {
        console.error('Error on retrieving data: ', error.message);
    }
}

setInterval(fetchFinanceData, 30000);
fetchFinanceData();

function sendCachedData(req, res, key) {
  const data = cache.get('finance');
  if (data && data[key]) {
      res.json(data[key]);
  } else {
      res.status(204).send();
  }
}

// Endpoints for client
app.get('/currencies', (req, res) => sendCachedData(req, res, 'currencies'));
app.get('/stocks', (req, res) => sendCachedData(req, res, 'stocks'));
app.get('/bitcoin', (req, res) => sendCachedData(req, res, 'bitcoin'));
app.get('/taxes', (req, res) => sendCachedData(req, res, 'taxes'));

app.listen(PORT, () => {
    console.log(`Server running on: ${PORT}`);
});