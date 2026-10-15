/**
 * KYC-AI — Intelligent Customer Onboarding and Document Verification Platform
 * Banking Core Authentication & Role-Based Access Control (RBAC) Module
 * 
 * Complies with Bangladesh Bank ICT Security Guidelines & BFIU Circular No. 26:
 * - NO public self-registration.
 * - Administrative user provisioning only.
 * - 5-attempt account lockout (HTTP 423).
 * - Constant-time password verification & PBKDF2 cryptographic hashing.
 * - Immutable audit trail on all auth events.
 */

import crypto from 'crypto';
import { caseDb } from './db.js';

export type UserRole = 'admin' | 'manager' | 'auditor' | 'customer';

export interface BankUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  phone: string;
  nidNumber?: string;
  branchName: string;
  passwordHash: string;
  salt: string;
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  mustChangePassword: boolean;
  lockoutUntil: string | null;
  lastLoginAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  phone: string;
  nidNumber?: string;
  branchName: string;
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  mustChangePassword: boolean;
  lockoutUntil: string | null;
  lastLoginAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'bangladesh-bank-core-secure-jwt-secret-key-2026';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

class AuthDatabase {
  private users: Map<string, BankUser> = new Map();
  private dummySalt: string = crypto.randomBytes(16).toString('hex');
  private dummyHash: string;

  constructor() {
    this.dummyHash = this.hashPasswordWithSalt('DummyPassword123#', this.dummySalt);
    this.seedDemoUsers();
  }

  private hashPasswordWithSalt(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  }

  public hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.hashPasswordWithSalt(password, salt);
    return { hash, salt };
  }

  public verifyPassword(password: string, hash: string, salt: string): boolean {
    const computed = this.hashPasswordWithSalt(password, salt);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  }

  private dummyVerify(): void {
    // Prevent user enumeration by taking constant time for non-existent users
    this.hashPasswordWithSalt('TimingMitigationAttempt#2026', this.dummySalt);
  }

  /**
   * Pre-seed standard banking demonstration accounts
   */
  private seedDemoUsers() {
    const demoAccounts: Array<{
      email: string;
      username: string;
      fullName: string;
      role: UserRole;
      phone: string;
      nidNumber: string;
      branchName: string;
      password: string;
    }> = [
      {
        email: 'admin@bank.com',
        username: 'admin_central',
        fullName: 'Chief Information Security Officer (CISO)',
        role: 'admin',
        phone: '+8801711000001',
        nidNumber: '19852692518000001',
        branchName: 'Head Office, Motijheel',
        password: 'Admin@123',
      },
      {
        email: 'manager@bank.com',
        username: 'manager_motijheel',
        fullName: 'Motijheel Branch Operations Manager',
        role: 'manager',
        phone: '+8801711000002',
        nidNumber: '19882692518000002',
        branchName: 'Motijheel Corporate Branch',
        password: 'Manager@123',
      },
      {
        email: 'auditor@bank.com',
        username: 'auditor_icc',
        fullName: 'Internal Control & Compliance Auditor',
        role: 'auditor',
        phone: '+8801711000003',
        nidNumber: '19922692518000003',
        branchName: 'Audit & Inspection Division',
        password: 'Auditor@123',
      },
      {
        email: 'customer1@bank.com',
        username: 'cust_tariq',
        fullName: 'Tariqul Islam (Retail Banking Applicant)',
        role: 'customer',
        phone: '+8801811000004',
        nidNumber: '5918239014',
        branchName: 'Gulshan North Branch',
        password: 'Cust@123',
      },
      {
        email: 'customer2@bank.com',
        username: 'cust_nusrat',
        fullName: 'Nusrat Jahan (SME Applicant)',
        role: 'customer',
        phone: '+8801911000005',
        nidNumber: '8219481023',
        branchName: 'Dhanmondi 27 Branch',
        password: 'Cust@123',
      },
    ];

    const now = new Date().toISOString();
    for (const acc of demoAccounts) {
      const id = `usr-${acc.username}`;
      const { hash, salt } = this.hashPassword(acc.password);
      this.users.set(acc.email.toLowerCase(), {
        id,
        email: acc.email.toLowerCase(),
        username: acc.username,
        fullName: acc.fullName,
        role: acc.role,
        phone: acc.phone,
        nidNumber: acc.nidNumber,
        branchName: acc.branchName,
        passwordHash: hash,
        salt,
        isActive: true,
        isLocked: false,
        failedLoginAttempts: 0,
        mustChangePassword: false, // Ready for instant evaluation
        lockoutUntil: null,
        lastLoginAt: null,
        createdBy: 'SYSTEM_BOOTSTRAP',
        createdAt: now,
        updatedAt: now,
      });

      // Audit seed action
      caseDb.logAuditEvent(
        'GLOBAL_AUTH',
        'SYSTEM_BOOTSTRAP',
        'USER_PROVISIONED',
        `Bootstrap seeded demo user: ${acc.email} (${acc.role.toUpperCase()})`,
        { email: acc.email, role: acc.role, branch: acc.branchName }
      );
    }
  }

  public toSummary(user: BankUser): UserSummary {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      nidNumber: user.nidNumber,
      branchName: user.branchName,
      isActive: user.isActive,
      isLocked: user.isLocked,
      failedLoginAttempts: user.failedLoginAttempts,
      mustChangePassword: user.mustChangePassword,
      lockoutUntil: user.lockoutUntil,
      lastLoginAt: user.lastLoginAt,
      createdBy: user.createdBy,
      createdAt: user.createdAt,
    };
  }

  public findByEmail(email: string): BankUser | undefined {
    return this.users.get(email.toLowerCase().trim());
  }

  public findById(id: string): BankUser | undefined {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  }

  public getAllUsers(): UserSummary[] {
    return Array.from(this.users.values()).map((u) => this.toSummary(u));
  }

  /**
   * Internal Provisioning / Register User inside the Software
   */
  public provisionUser(
    actor: BankUser,
    data: {
      fullName: string;
      email: string;
      username: string;
      role: UserRole;
      phone: string;
      nidNumber?: string;
      branchName?: string;
      password: string;
      mustChangePassword?: boolean;
    },
    ip: string
  ): UserSummary {
    const emailKey = data.email.toLowerCase().trim();
    if (this.users.has(emailKey)) {
      throw new Error(`User with email '${data.email}' already exists in banking registry.`);
    }

    // Role boundary validation: Managers cannot provision Admins
    if (actor.role === 'manager' && data.role === 'admin') {
      throw new Error('Branch Managers are forbidden from provisioning Administrator credentials.');
    }

    // Password Complexity Validation (Bangladesh Bank Standards)
    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters in length.');
    }
    if (!/[A-Z]/.test(data.password) || !/[a-z]/.test(data.password) || !/\d/.test(data.password)) {
      throw new Error('Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit.');
    }

    const { hash, salt } = this.hashPassword(data.password);
    const now = new Date().toISOString();
    const id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newUser: BankUser = {
      id,
      email: emailKey,
      username: data.username.trim(),
      fullName: data.fullName.trim(),
      role: data.role,
      phone: data.phone.trim(),
      nidNumber: data.nidNumber?.trim(),
      branchName: data.branchName?.trim() || actor.branchName || 'Dhaka Corporate Branch',
      passwordHash: hash,
      salt,
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
      mustChangePassword: data.mustChangePassword ?? true,
      lockoutUntil: null,
      lastLoginAt: null,
      createdBy: actor.email,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(emailKey, newUser);

    // Audit Event
    caseDb.logAuditEvent(
      'GLOBAL_AUTH',
      actor.email,
      'USER_PROVISIONED',
      `Officer ${actor.fullName} (${actor.role}) provisioned new account ${newUser.email} with role ${newUser.role.toUpperCase()}`,
      {
        provisionedUserId: newUser.id,
        provisionedEmail: newUser.email,
        assignedRole: newUser.role,
        branch: newUser.branchName,
        ipAddress: ip,
      }
    );

    return this.toSummary(newUser);
  }

  /**
   * Unlock an account locked by 5 failed attempts
   */
  public unlockAccount(actor: BankUser, targetUserId: string, ip: string): UserSummary {
    const user = this.findById(targetUserId);
    if (!user) {
      throw new Error('Target user account not found.');
    }

    user.isLocked = false;
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    user.updatedAt = new Date().toISOString();

    caseDb.logAuditEvent(
      'GLOBAL_AUTH',
      actor.email,
      'ACCOUNT_UNLOCKED',
      `Officer ${actor.email} manually unlocked account ${user.email}`,
      { targetUserId: user.id, targetEmail: user.email, ipAddress: ip }
    );

    return this.toSummary(user);
  }

  /**
   * Toggle active status
   */
  public toggleUserStatus(actor: BankUser, targetUserId: string, ip: string): UserSummary {
    const user = this.findById(targetUserId);
    if (!user) {
      throw new Error('Target user account not found.');
    }

    if (user.id === actor.id) {
      throw new Error('Cannot deactivate your own logged-in account.');
    }

    user.isActive = !user.isActive;
    user.updatedAt = new Date().toISOString();

    caseDb.logAuditEvent(
      'GLOBAL_AUTH',
      actor.email,
      'USER_STATUS_TOGGLED',
      `Officer ${actor.email} changed account status for ${user.email} to ${user.isActive ? 'ACTIVE' : 'DEACTIVATED'}`,
      { targetUserId: user.id, newStatus: user.isActive, ipAddress: ip }
    );

    return this.toSummary(user);
  }

  /**
   * Authenticate and enforce 5-attempt lockout policy
   */
  public authenticate(
    email: string,
    password: string,
    ip: string,
    userAgent?: string
  ): { user: BankUser; token: string } {
    const user = this.findByEmail(email);

    if (!user) {
      this.dummyVerify();
      caseDb.logAuditEvent(
        'GLOBAL_AUTH',
        email || 'UNKNOWN_APPLICANT',
        'LOGIN_FAILED',
        `Failed authentication attempt for unknown email: ${email}`,
        { ipAddress: ip, userAgent, reason: 'ACCOUNT_NOT_FOUND' }
      );
      throw new Error('Invalid credentials. Please verify your email and password.');
    }

    const now = new Date();

    // Check Lockout
    if (user.isLocked) {
      if (user.lockoutUntil && now >= new Date(user.lockoutUntil)) {
        // Automatic unlock after 30 minutes
        user.isLocked = false;
        user.failedLoginAttempts = 0;
        user.lockoutUntil = null;
      } else {
        const remainingMinutes = user.lockoutUntil
          ? Math.max(1, Math.ceil((new Date(user.lockoutUntil).getTime() - now.getTime()) / 60000))
          : LOCKOUT_MINUTES;

        caseDb.logAuditEvent(
          'GLOBAL_AUTH',
          user.email,
          'LOGIN_REJECTED_LOCKED',
          `Login attempt on locked account ${user.email}`,
          { ipAddress: ip, userAgent, remainingMinutes }
        );

        const err = new Error(
          `Account is temporarily locked due to consecutive failed logins. Try again in ${remainingMinutes} minute(s) or contact Branch Admin.`
        );
        (err as any).statusCode = 423; // Locked
        throw err;
      }
    }

    // Check Active Status
    if (!user.isActive) {
      caseDb.logAuditEvent(
        'GLOBAL_AUTH',
        user.email,
        'LOGIN_REJECTED_INACTIVE',
        `Login attempt on deactivated account ${user.email}`,
        { ipAddress: ip, userAgent }
      );
      const err = new Error('Account has been deactivated. Please contact your Branch Operations Manager.');
      (err as any).statusCode = 403;
      throw err;
    }

    // Verify Password
    const isValid = this.verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.isLocked = true;
        user.lockoutUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60000).toISOString();

        caseDb.logAuditEvent(
          'GLOBAL_AUTH',
          user.email,
          'ACCOUNT_AUTO_LOCKED',
          `Security trigger: Account ${user.email} locked after ${MAX_FAILED_ATTEMPTS} consecutive failures.`,
          { ipAddress: ip, userAgent, lockoutMinutes: LOCKOUT_MINUTES }
        );
      } else {
        caseDb.logAuditEvent(
          'GLOBAL_AUTH',
          user.email,
          'LOGIN_FAILED',
          `Password mismatch for ${user.email} (Attempt ${user.failedLoginAttempts}/${MAX_FAILED_ATTEMPTS})`,
          { ipAddress: ip, userAgent, failedAttempts: user.failedLoginAttempts }
        );
      }

      throw new Error('Invalid credentials. Please verify your email and password.');
    }

    // Successful Login: Reset failed counters
    user.failedLoginAttempts = 0;
    user.lastLoginAt = now.toISOString();

    caseDb.logAuditEvent(
      'GLOBAL_AUTH',
      user.email,
      'LOGIN_SUCCESS',
      `Successful authentication by ${user.fullName} (${user.role.toUpperCase()}) from ${ip}`,
      { ipAddress: ip, userAgent, role: user.role, branch: user.branchName }
    );

    const token = this.generateToken(user);
    return { user, token };
  }

  public changePassword(
    user: BankUser,
    currentPass: string,
    newPass: string,
    ip: string
  ): void {
    if (!this.verifyPassword(currentPass, user.passwordHash, user.salt)) {
      throw new Error('Current password verification failed.');
    }

    if (newPass.length < 8) {
      throw new Error('New password must be at least 8 characters.');
    }
    if (!/[A-Z]/.test(newPass) || !/[a-z]/.test(newPass) || !/\d/.test(newPass)) {
      throw new Error('New password must contain uppercase, lowercase, and numeric characters.');
    }
    if (this.verifyPassword(newPass, user.passwordHash, user.salt)) {
      throw new Error('New password cannot be identical to current password.');
    }

    const { hash, salt } = this.hashPassword(newPass);
    user.passwordHash = hash;
    user.salt = salt;
    user.mustChangePassword = false;
    user.updatedAt = new Date().toISOString();

    caseDb.logAuditEvent(
      'GLOBAL_AUTH',
      user.email,
      'PASSWORD_CHANGED',
      `User ${user.email} updated credentials`,
      { ipAddress: ip }
    );
  }

  public generateToken(user: BankUser): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.fullName,
      branch: user.branchName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 * 8, // 8-hour shift token
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    return `${header}.${body}.${signature}`;
  }

  public verifyToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, body, signature] = parts;
      const expected = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${body}`)
        .digest('base64url');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return null;
      }

      const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
      if (decoded.exp && Date.now() / 1000 > decoded.exp) {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }
}

export const authDb = new AuthDatabase();
