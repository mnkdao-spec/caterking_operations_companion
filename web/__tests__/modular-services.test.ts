import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Modular Services Infrastructure', () => {
  const services = [
    'clients.ts',
    'staff.ts',
    'events.ts',
    'inventory.ts',
    'invoices.ts',
    'suppliers.ts'
  ];

  services.forEach(service => {
    it(`should have the ${service} file in web/lib/services/`, () => {
      const filePath = path.resolve(__dirname, `../lib/services/${service}`);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});
