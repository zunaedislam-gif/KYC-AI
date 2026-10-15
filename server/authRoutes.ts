/**
 * KYC-AI — Intelligent Customer Onboarding and Document Verification Platform
 * Express Auth & User Management Router
 * 
 * Features:
 * - Banking login with 5-attempt brute-force lockout
 * - No public self-registration (KYC compliant)
 * - Administrative user provisioning inside the software
 * - Account unlock and status management
 */

import { Router, Request, Response } from 'express';
import { authDb, UserRole } from './auth.js';

export const authRouter = Router();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

function extractBearerUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const payload = authDb.verifyToken(token);
  if (!payload || !payload.sub) {
    return null;
  }
  const user = authDb.findById(payload.sub);
  return user || null;
}

/**
 * POST /api/auth/login and POST /api/login
 * Public authentication gate (NO public registration endpoint exists)
 */
authRouter.post(['/auth/login', '/login'], (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'];

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required fields.' });
    return;
  }

  try {
    const { user, token } = authDb.authenticate(email, password, ip, userAgent);
    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 28800, // 8 hours
      must_change_password: user.mustChangePassword,
      user: authDb.toSummary(user),
    });
  } catch (err: any) {
    const status = err.statusCode || 401;
    res.status(status).json({
      error: err.message || 'Authentication failed.',
      statusCode: status,
    });
  }
});

/**
 * GET /api/auth/me and GET /api/me
 * Fetch authenticated user profile
 */
authRouter.get(['/auth/me', '/me'], (req: Request, res: Response) => {
  const user = extractBearerUser(req);
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid authentication token.' });
    return;
  }
  res.json(authDb.toSummary(user));
});

/**
 * POST /api/auth/logout and POST /api/logout
 */
authRouter.post(['/auth/logout', '/logout'], (req: Request, res: Response) => {
  // Stateless token; client drops token, event logged
  res.json({ message: 'Session successfully concluded.' });
});

/**
 * POST /api/auth/change-password
 */
authRouter.post(['/auth/change-password', '/change-password'], (req: Request, res: Response) => {
  const user = extractBearerUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }

  try {
    const ip = getClientIp(req);
    authDb.changePassword(user, currentPassword, newPassword, ip);
    res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/admin/users
 * List all users (Admin, Manager, Auditor only)
 */
authRouter.get('/admin/users', (req: Request, res: Response) => {
  const user = extractBearerUser(req);
  if (!user || (user.role !== 'admin' && user.role !== 'manager' && user.role !== 'auditor')) {
    res.status(403).json({ error: 'Forbidden. Requires banking management or auditor role.' });
    return;
  }

  const users = authDb.getAllUsers();
  res.json(users);
});

/**
 * POST /api/admin/users
 * Internal Registration / Staff Provisioning (Inside the Software)
 * Restricted to Admin and Manager roles.
 */
authRouter.post('/admin/users', (req: Request, res: Response) => {
  const actor = extractBearerUser(req);
  if (!actor || (actor.role !== 'admin' && actor.role !== 'manager')) {
    res.status(403).json({
      error: 'Forbidden. User provisioning requires Administrator or Branch Manager authorization.',
    });
    return;
  }

  const {
    fullName,
    email,
    username,
    role,
    phone,
    nidNumber,
    branchName,
    password,
    mustChangePassword,
  } = req.body;

  if (!fullName || !email || !username || !role || !phone || !password) {
    res.status(400).json({
      error: 'Mandatory fields missing: fullName, email, username, role, phone, and temporary password.',
    });
    return;
  }

  const allowedRoles: UserRole[] = ['admin', 'manager', 'auditor', 'customer'];
  if (!allowedRoles.includes(role)) {
    res.status(400).json({ error: `Invalid role specified. Allowed: ${allowedRoles.join(', ')}` });
    return;
  }

  try {
    const ip = getClientIp(req);
    const provisioned = authDb.provisionUser(
      actor,
      {
        fullName,
        email,
        username,
        role,
        phone,
        nidNumber,
        branchName,
        password,
        mustChangePassword: mustChangePassword !== false,
      },
      ip
    );

    res.status(201).json(provisioned);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/admin/users/:id/unlock
 */
authRouter.post('/admin/users/:id/unlock', (req: Request, res: Response) => {
  const actor = extractBearerUser(req);
  if (!actor || (actor.role !== 'admin' && actor.role !== 'manager')) {
    res.status(403).json({ error: 'Requires Administrator or Branch Manager authorization.' });
    return;
  }

  try {
    const ip = getClientIp(req);
    const unlocked = authDb.unlockAccount(actor, req.params.id, ip);
    res.json(unlocked);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/admin/users/:id/toggle-status
 */
authRouter.post('/admin/users/:id/toggle-status', (req: Request, res: Response) => {
  const actor = extractBearerUser(req);
  if (!actor || actor.role !== 'admin') {
    res.status(403).json({ error: 'Requires Administrator authorization.' });
    return;
  }

  try {
    const ip = getClientIp(req);
    const updated = authDb.toggleUserStatus(actor, req.params.id, ip);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
