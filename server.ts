import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import proxy from 'express-http-proxy';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const APP_SECURE_PIN = process.env.APP_SECURE_PIN || '2001';

const app = express();
app.use(cookieParser());

// We must apply express.json() AFTER the proxy routes if we want proxy to handle raw streams for FormData,
// OR apply it before but express-http-proxy handles parsed body. 
// It's safer to configure proxy routes BEFORE global body parsers.

app.set('trust proxy', 1);

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// --- PROXY ROUTES ---
// We define them before express.json() so express-http-proxy can handle raw streams (FormData).

const proxyOptions = (apiKeyEnv: string) => ({
  proxyReqOptDecorator: function(proxyReqOpts: any, srcReq: any) {
    proxyReqOpts.headers['Authorization'] = `Bearer ${process.env[apiKeyEnv] || ''}`;
    return proxyReqOpts;
  },
  limit: '50mb'
});

app.use('/api/proxy/xai', requireAuth, proxy('https://api.x.ai', proxyOptions('XAI_API_KEY')));
app.use('/api/proxy/wavespeed', requireAuth, proxy('https://api.wavespeed.ai', proxyOptions('WAVESPEED_API_KEY')));
app.use('/api/proxy/atlas', requireAuth, proxy('https://api.atlascloud.ai', proxyOptions('ATLAS_API_KEY')));

// --- JSON API ROUTES ---
app.use(express.json({ limit: '50mb' }));

const loginAttempts = new Map<string, { count: number, resetAt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

app.post('/api/auth/login', (req: any, res: any) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  
  const attempt = loginAttempts.get(ip) || { count: 0, resetAt: now + LOCKOUT_MS };
  if (now > attempt.resetAt) {
    attempt.count = 0;
    attempt.resetAt = now + LOCKOUT_MS;
  }
  
  if (attempt.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }

  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'PIN required' });
  }

  try {
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(String(pin).padEnd(32, ' ')), 
      Buffer.from(APP_SECURE_PIN.padEnd(32, ' '))
    );
    if (isMatch) {
      req.session.authenticated = true;
      loginAttempts.delete(ip);
      return res.json({ success: true });
    }
  } catch (e) {
    // Length mismatch fallback
  }

  attempt.count += 1;
  loginAttempts.set(ip, attempt);
  res.status(401).json({ error: 'Invalid PIN' });
});

app.post('/api/auth/logout', (req: any, res: any) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/auth/status', (req: any, res: any) => {
  res.json({ authenticated: !!req.session.authenticated });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
