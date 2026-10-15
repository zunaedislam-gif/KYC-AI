/**
 * KYC-AI — Intelligent Customer Onboarding and Document Verification Platform
 * Auth & User Provisioning API Service
 */

import { BankUser, ProvisionUserData } from '../types/auth';

const TOKEN_KEY = 'bank_kyc_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function loginUser(email: string, password: string): Promise<{
  access_token: string;
  user: BankUser;
  must_change_password: boolean;
}> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Authentication failed');
  }

  setStoredToken(data.access_token);
  return data;
}

export async function fetchCurrentUser(): Promise<BankUser> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    clearStoredToken();
    throw new Error('Session expired');
  }

  return res.json();
}

export async function logoutUser(): Promise<void> {
  const token = getStoredToken();
  try {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } finally {
    clearStoredToken();
  }
}

export async function fetchAllUsers(): Promise<BankUser[]> {
  const token = getStoredToken();
  const res = await fetch('/api/admin/users', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to retrieve banking users');
  }

  return res.json();
}

export async function provisionNewUser(userData: ProvisionUserData): Promise<BankUser> {
  const token = getStoredToken();
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to provision user');
  }

  return data;
}

export async function unlockUserAccount(userId: string): Promise<BankUser> {
  const token = getStoredToken();
  const res = await fetch(`/api/admin/users/${userId}/unlock`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to unlock user');
  }

  return data;
}

export async function toggleUserActiveStatus(userId: string): Promise<BankUser> {
  const token = getStoredToken();
  const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to toggle user status');
  }

  return data;
}
