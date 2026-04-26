const fetch = require('node-fetch');
const http = require('http');

const CREDS = {
  test:   { id: 'chpippin-api-client',  secret: 'uIYSuvvgCk7PhBfukvMWp0itOKVXatTw' },
  stream: { id: 'txpslive-api-client',   secret: '5Ddhy9ePRjTxp7oTW07ROQaqNNpwbbd8' }
};

let tokenCache = { test: null, stream: null };
let tokenExpiry = { test: 0, stream: 0 };

async function getToken(mode) {
  if (tokenCache[mode] && Date.now() < tokenExpiry[mode]) return tokenCache[mode];
  const creds = CREDS[mode] || CREDS.test;
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', creds.id);
  params.append('client_secret', creds.secret);
  const res = await fetch('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  const data = await res.json();
  tokenCache[mode] = data.access_token;
  tokenExpiry[mode] = Date.now() + ((data.expires_in || 1800) - 30) * 1000;
  return tokenCache[mode];
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.searchParams.get('action');
  const mode = url.searchParams.get('mode') || 'test';

  try {
    if (action === 'token') {
      const token = await getToken(mode);
      res.writeHead(200);
      res.end(JSON.stringify({ access_token: token }));
      return;
    }

    if (action === 'states') {
      const token = await getToken(mode);
      const lamin = url.searchParams.get('lamin') || '29.7';
      const lomin = url.searchParams.get('lomin') || '-95.6';
      const lamax = url.searchParams.get('lamax') || '30.2';
      const lomax = url.searchParams.get('lomax') || '-95.0';
      const osUrl = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
      const osRes = await fetch(osUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await osRes.json();
      res.writeHead(200);
      res.end(JSON.stringify(data));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify({ status: 'TXPS OpenSky Server OK' }));

  } catch(e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`TXPS OpenSky server running on port ${PORT}`));
