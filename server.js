const fetch = require('node-fetch');
const http = require('http');
 
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json'
};
 
const server = http.createServer(async (req, res) => {
  Object.entries(CORS).forEach(([k,v]) => res.setHeader(k, v));
 
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
 
  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.searchParams.get('action');
 
  try {
 
    // METAR
    if (action === 'metar') {
      const airport = url.searchParams.get('airport') || 'KIAH';
      const metarRes = await fetch(`https://aviationweather.gov/api/data/metar?ids=${airport}&format=json`);
      const data = await metarRes.json();
      res.writeHead(200);
      res.end(JSON.stringify(data));
      return;
    }
 
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'TXPS Server OK' }));
 
  } catch(e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
});
 
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`TXPS server running on port ${PORT}`));
