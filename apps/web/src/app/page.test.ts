import { describe, it, expect } from 'vitest';
import HomePage from './page.js';

describe('HomePage', () => {
  it('is a valid React component function', () => {
    expect(typeof HomePage).toBe('function');
  });
});
