import { describe, it, expect } from 'vitest';
import { getIdentityPhrase } from '../identity';

describe('getIdentityPhrase', () => {
  it('returns full identity with all fields', () => {
    const result = getIdentityPhrase({
      name: 'Sarah',
      dob: 'January 15, 1985',
      address: '123 Main St, Seattle WA 98101',
    });
    expect(result).toContain('Sarah');
    expect(result).toContain('January 15, 1985');
    expect(result).toContain('123 Main St, Seattle WA 98101');
  });

  it('handles missing name', () => {
    const result = getIdentityPhrase({ name: '', dob: 'Jan 1', address: '123 Main' });
    expect(result).not.toContain('My name is');
    expect(result).toContain('Jan 1');
  });

  it('handles missing dob', () => {
    const result = getIdentityPhrase({ name: 'Sarah', dob: '', address: '123 Main' });
    expect(result).toContain('Sarah');
    expect(result).not.toContain('born');
  });

  it('handles missing address', () => {
    const result = getIdentityPhrase({ name: 'Sarah', dob: 'Jan 1', address: '' });
    expect(result).toContain('Sarah');
    expect(result).not.toContain('address');
  });

  it('handles all fields empty', () => {
    const result = getIdentityPhrase({ name: '', dob: '', address: '' });
    expect(typeof result).toBe('string');
  });
});
