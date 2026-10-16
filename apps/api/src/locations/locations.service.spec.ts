import { describe, expect, it } from 'vitest';
import { LocationsService } from './locations.service.js';

describe('LocationsService', () => {
  const service = new LocationsService();
  it('preserves DIVIPOLA leading zeros and returns municipalities by department', () => {
    expect(service.departments()).toContainEqual({
      code: '05',
      name: 'ANTIOQUIA',
    });
    expect(service.municipalities('05')).toContainEqual({
      code: '05001',
      name: 'MEDELLÍN',
    });
    expect(service.municipality('11001')).toMatchObject({
      department: 'BOGOTÁ, D.C.',
      name: 'BOGOTÁ, D.C.',
    });
  });
});
