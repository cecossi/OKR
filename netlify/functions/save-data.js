// Netlify Function: recebe dados do dashboard e salva no GitHub
// Variável de ambiente necessária: GITHUB_TOKEN (PAT com escopo repo)

const GH_OWNER = 'cecossi';
const GH_REPO  = 'OKR';
const GH_PATH  = 'data/okr-data.json';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'method' }) };

  const token = process.env.GITHUB_TOKEN;
  if (!token) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'not_configured' }) };

  let payload;
  try { payload = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'bad_json' }) }; }

  const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`;
  const ghHeaders = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'OKR-Dashboard'
  };

  // Pega SHA atual do arquivo (necessário para update)
  let sha = null;
  try {
    const r = await fetch(apiUrl, { headers: ghHeaders });
    if (r.ok) sha = (await r.json()).sha;
  } catch {}

  const content = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');
  const body = {
    message: `OKR sync ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    content,
    ...(sha && { sha })
  };

  const put = await fetch(apiUrl, { method: 'PUT', headers: ghHeaders, body: JSON.stringify(body) });

  if (put.ok) return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };

  const errText = await put.text();
  console.error('GitHub API error:', put.status, errText);
  return { statusCode: put.status, headers: CORS, body: errText };
};
