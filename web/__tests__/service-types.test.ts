import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Service Types Infrastructure', () => {
  it('should have the service-types.ts file in web/lib/services/', () => {
    const filePath = path.resolve(__dirname, '../lib/services/service-types.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
