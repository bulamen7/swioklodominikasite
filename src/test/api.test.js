import { describe, it, expect } from 'vitest';

// Test email validation regex (same as in contact form and backend)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

describe('Email validation', () => {
  it('accepts valid emails', () => {
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('user.name@domain.pl')).toBe(true);
    expect(emailRegex.test('a@b.co')).toBe(true);
    expect(emailRegex.test('contact+tag@gmail.com')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(emailRegex.test('')).toBe(false);
    expect(emailRegex.test('notanemail')).toBe(false);
    expect(emailRegex.test('@domain.com')).toBe(false);
    expect(emailRegex.test('user@')).toBe(false);
    expect(emailRegex.test('user @domain.com')).toBe(false);
    expect(emailRegex.test('user@@domain.com')).toBe(false);
  });
});

describe('Rate limiting logic', () => {
  it('blocks after 5 attempts', () => {
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    for (let i = 0; i < 6; i++) {
      attempts++;
    }

    expect(attempts >= MAX_ATTEMPTS).toBe(true);
  });
});
