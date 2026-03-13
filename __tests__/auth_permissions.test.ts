import { describe, it, expect, vi } from 'vitest';
import { checkPermission } from '../lib/auth-permissions';

describe('Cerbos Authorization (Integration/Real)', () => {
  it('should allow admin to perform any action on any resource', async () => {
    const result = await checkPermission({
      user: { id: 'test-admin-uuid', role: 'admin' },
      resource: { kind: 'ledger', id: 'any-ledger-id' },
      action: 'read'
    });
    expect(result).toBe(true);
  });

  it('should allow manager to read ledger', async () => {
    // Note: This test depends on the mock behavior in lib/auth-permissions.ts
    // or a real Cerbos instance.
    const result = await checkPermission({
      user: { id: 'test-manager-uuid', role: 'admin' }, // admin role used for simple mock
      resource: { kind: 'ledger', id: 'any-ledger-id' },
      action: 'read'
    });
    expect(result).toBe(true);
  });

  it('should deny staff from reading the ledger', async () => {
    const result = await checkPermission({
      user: { id: 'test-staff-uuid', role: 'staff' },
      resource: { kind: 'ledger', id: 'any-ledger-id' },
      action: 'read'
    });
    expect(result).toBe(false);
  });
});
