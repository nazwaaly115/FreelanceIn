const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'freelancein-dev-secret-change-in-production';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token autentikasi diperlukan' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa' });
  }
}

function roleRequired(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses ditolak untuk peran ini' });
    }
    next();
  };
}

function publicUser(row) {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  if (safe.skills && typeof safe.skills === 'string') {
    try { safe.skills = JSON.parse(safe.skills); } catch { safe.skills = []; }
  }
  if (safe.portfolio && typeof safe.portfolio === 'string') {
    try { safe.portfolio = JSON.parse(safe.portfolio); } catch { safe.portfolio = []; }
  }
  return safe;
}

module.exports = { JWT_SECRET, signToken, authRequired, roleRequired, publicUser };
