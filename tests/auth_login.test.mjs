/**
 * Automated Test Suite for Banking Core Authentication & Internal Provisioning
 * Tests login, 5-attempt brute-force lockout, token issuance,
 * zero public registration, and internal administrative user provisioning.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { authDb } from '../server/auth.js';

test('1. Banking Authentication & Security Standards', async (t) => {
  await t.test('Admin logs in with valid credentials', () => {
    const res = authDb.authenticate('admin@bank.com', 'Admin@123', '127.0.0.1');
    assert.ok(res.token, 'Must return signed token');
    assert.equal(res.user.role, 'admin');
    assert.equal(res.user.email, 'admin@bank.com');
    assert.equal(res.user.failedLoginAttempts, 0);
  });

  await t.test('Rejects invalid password with generic message', () => {
    assert.throws(
      () => {
        authDb.authenticate('admin@bank.com', 'WrongPassword!123', '127.0.0.1');
      },
      (err) => {
        return err.message.includes('Invalid credentials');
      }
    );
  });

  await t.test('Rejects unknown email without user enumeration', () => {
    assert.throws(
      () => {
        authDb.authenticate('nonexistent@bank.com', 'SomePassword123#', '127.0.0.1');
      },
      (err) => {
        return err.message.includes('Invalid credentials');
      }
    );
  });

  await t.test('Enforces 5-attempt account lockout (HTTP 423)', () => {
    const targetEmail = 'customer2@bank.com';
    // Send 5 consecutive failed logins
    for (let i = 0; i < 5; i++) {
      try {
        authDb.authenticate(targetEmail, 'WrongAttempt!99', '127.0.0.1');
      } catch {
        // Expected
      }
    }

    const lockedUser = authDb.findByEmail(targetEmail);
    assert.equal(lockedUser?.isLocked, true, 'User must be marked isLocked = true');

    // 6th attempt must be rejected with lockout message
    assert.throws(
      () => {
        authDb.authenticate(targetEmail, 'WrongAttempt!99', '127.0.0.1');
      },
      (err) => {
        return err.statusCode === 423 && err.message.includes('temporarily locked');
      }
    );
  });
});

test('2. Administrative User Provisioning Inside the Software', async (t) => {
  const admin = authDb.findByEmail('admin@bank.com');
  assert.ok(admin, 'Admin must exist');

  await t.test('Admin provisions new banking officer internally', () => {
    const newUser = authDb.provisionUser(
      admin,
      {
        fullName: 'Shamsur Rahman',
        email: 'shamsur@bank.com',
        username: 'srahman',
        role: 'manager',
        phone: '+8801733445566',
        nidNumber: '19892692518000009',
        branchName: 'Dhanmondi Branch',
        password: 'ManagerSecure@2026',
        mustChangePassword: true,
      },
      '127.0.0.1'
    );

    assert.equal(newUser.email, 'shamsur@bank.com');
    assert.equal(newUser.role, 'manager');
    assert.equal(newUser.createdBy, 'admin@bank.com');

    // Verify provisioned officer can now log in
    const loginRes = authDb.authenticate('shamsur@bank.com', 'ManagerSecure@2026', '127.0.0.1');
    assert.ok(loginRes.token);
    assert.equal(loginRes.user.role, 'manager');
  });

  await t.test('Manager cannot provision Admin role (Role boundary)', () => {
    const manager = authDb.findByEmail('manager@bank.com');
    assert.ok(manager);

    assert.throws(
      () => {
        authDb.provisionUser(
          manager,
          {
            fullName: 'Illegal Admin',
            email: 'illegal@bank.com',
            username: 'iadmin',
            role: 'admin',
            phone: '+8801700000000',
            password: 'AdminPassword!2026',
          },
          '127.0.0.1'
        );
      },
      (err) => {
        return err.message.includes('forbidden from provisioning Administrator');
      }
    );
  });

  await t.test('Admin can unlock a locked account', () => {
    const lockedUser = authDb.findByEmail('customer2@bank.com');
    assert.ok(lockedUser?.isLocked);

    authDb.unlockAccount(admin, lockedUser.id, '127.0.0.1');
    assert.equal(lockedUser.isLocked, false);
    assert.equal(lockedUser.failedLoginAttempts, 0);

    // Can now log in with correct credentials
    const loginRes = authDb.authenticate('customer2@bank.com', 'Cust@123', '127.0.0.1');
    assert.ok(loginRes.token);
  });
});
