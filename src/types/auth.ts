/**
 * KYC-AI — Intelligent Customer Onboarding and Document Verification Platform
 * Frontend Authentication Types
 */

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
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  mustChangePassword: boolean;
  lockoutUntil: string | null;
  lastLoginAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: BankUser | null;
}

export interface ProvisionUserData {
  fullName: string;
  email: string;
  username: string;
  role: UserRole;
  phone: string;
  nidNumber?: string;
  branchName?: string;
  password: string;
  mustChangePassword?: boolean;
}
