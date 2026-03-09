/**
 * SpotKin Backend Worker - QUICK START VERSION
 * 
 * Copy this entire file into Cloudflare Workers dashboard
 * Provides: TURN credentials + AI image classification
 * 
 * Deploy steps:
 * 1. Go to dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Name it: spotkin-backend
 * 3. Click "Deploy" then "Edit Code"
 * 4. PASTE THIS ENTIRE FILE
 * 5. Update CONFIG section below
 * 6. Click "Save and Deploy"
 * 7. Go to Settings → Variables → Add Secret: CLOUDFLARE_API_TOKEN
 */

// ==================== CONFIGURATION - UPDATE THESE ====================

const CONFIG = {
  // Your Cloudflare TURN Key ID (keep this)
  TURN_KEY_ID: '64830439d3658d251a40c3d47b0b86b8',
  
  // UPDATE: Your GitHub Pages URL
  ALLOWED_ORIGINS: [
    'https://dseeker.github.io',           // Your GitHub Pages
    'https://dseeker.github.io/spotkin',   // Your repo (if applicable)
    'http://localhost:3000',               // Local dev
    'http://localhost:8080',
    null                                   // Direct API calls
  ],
  
  // Rate limits per IP per hour
  RATE_LIMIT_AI: 50,
  RATE_LIMIT_TURN: 100,
  
  // Credential lifetime (24 hours)
  CREDENTIAL_TTL: 86400,
  
  // AI Model for image classification
  AI_MODEL: '@cf/meta/llama-3.2-11b-vision-instruct'
};

// Rate limiting storage
const rateLimitMap = new Map();

// ==================== MAIN HANDLER ====================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204, 
        headers: getCorsHeaders(origin) 
      });
    }
    
    // Route to handler
    if (url.pathname === '/turn') {
      return handleTurn(request, env, origin, clientIP);
    }
    if (url.pathname === '/classify') {
      return handleClassify(request, env, origin, clientIP);
    }
    if (url.pathname === '/health') {
      return json({ status: 'ok', service: 'spotkin-backend' }, 200, origin);
    }
    
    return json({ error: 'Not found. Try /turn, /classify, or /health' }, 404, origin);
  }
};

// ==================== TURN HANDLER ====================

async function handleTurn(request, env, origin, ip) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin);
  }
  
  if (!isAllowed(origin)) {
    return json({ error: 'Origin not allowed' }, 403, origin);
  }
  
  if (!rateLimit(ip, 'turn', CONFIG.RATE_LIMIT_TURN)) {
    return json({ error: 'Rate limit exceeded' }, 429, origin);
  }
  
  try {
    const token = env.CLOUDFLARE_API_TOKEN;
    if (!token) throw new Error('CLOUDFLARE_API_TOKEN not set');
    
    const res = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${CONFIG.TURN_KEY_ID}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ttl: CONFIG.CREDENTIAL_TTL })
      }
    );
    
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    
    const data = await res.json();
    return json(data, 200, origin);
    
  } catch (err) {
    console.error('TURN error:', err);
    return json({ error: err.message }, 500, origin);
  }
}

// ==================== AI CLASSIFICATION HANDLER ====================

async function handleClassify(request, env, origin, ip) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin);
  }
  
  if (!isAllowed(origin)) {
    return json({ error: 'Origin not allowed' }, 403, origin);
  }
  
  if (!rateLimit(ip, 'ai', CONFIG.RATE_LIMIT_AI)) {
    return json({ error: 'AI rate limit exceeded' }, 429, origin);
  }
  
  try {
    const body = await request.json();
    if (!body.image) {
      return json({ error: 'No image provided' }, 400, origin);
    }
    
    // Extract base64
    let img = body.image;
    if (img.includes(',')) img = img.split(',')[1];
    
    // Default prompt for baby/pet monitoring
    const prompt = body.prompt || `Analyze this image for baby/pet monitoring.
    Provide JSON with: scene (description), alert {type, message}, objects[], hasPetsOrBabies.
    Alert type: "safe", "warning", or "danger".`;
    
    // Call Workers AI
    const result = await env.AI.run(CONFIG.AI_MODEL, {
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image', image: img }
        ]
      }]
    });
    
    return json({
      success: true,
      model: CONFIG.AI_MODEL,
      result: parseResult(result),
      timestamp: new Date().toISOString()
    }, 200, origin);
    
  } catch (err) {
    console.error('AI error:', err);
    return json({ error: err.message }, 500, origin);
  }
}

// ==================== HELPERS ====================

function parseResult(aiResponse) {
  const content = aiResponse.response || '';
  
  // Try to find JSON in response
  const match = content.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      return {
        scene: parsed.scene || content.slice(0, 200),
        alert: parsed.alert || { type: 'safe', message: 'No concerns' },
        objects: parsed.objects || [],
        hasPetsOrBabies: parsed.hasPetsOrBabies || false
      };
    } catch (e) {}
  }
  
  // Fallback
  return {
    scene: content.slice(0, 200),
    alert: { type: 'safe', message: 'Analysis complete' },
    objects: [],
    hasPetsOrBabies: false
  };
}

function isAllowed(origin) {
  if (!origin) return CONFIG.ALLOWED_ORIGINS.includes(null);
  return CONFIG.ALLOWED_ORIGINS.some(a => origin === a || origin.startsWith(a));
}

function rateLimit(ip, type, limit) {
  const key = `${ip}:${type}`;
  const now = Date.now();
  const hourAgo = now - 3600000;
  let reqs = (rateLimitMap.get(key) || []).filter(t => t > hourAgo);
  if (reqs.length >= limit) return false;
  reqs.push(now);
  rateLimitMap.set(key, reqs);
  return true;
}

function getCorsHeaders(origin) {
  const allowed = isAllowed(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getCorsHeaders(origin),
      'Content-Type': 'application/json'
    }
  });
}
