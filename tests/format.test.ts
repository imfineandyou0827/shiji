import { describe, expect, it } from 'vitest';
import { isWebUrl, normalizeWebUrl } from '../src/utils/format';

describe('isWebUrl', () => {
  it('accepts http and https links', () => {
    expect(isWebUrl('http://example.com')).toBe(true);
    expect(isWebUrl('https://example.com/video?t=10')).toBe(true);
  });

  it('rejects other protocols and invalid values', () => {
    expect(isWebUrl('javascript:alert(1)')).toBe(false);
    expect(isWebUrl('ftp://example.com')).toBe(false);
    expect(isWebUrl('not a url')).toBe(false);
    expect(isWebUrl('')).toBe(false);
  });
});

describe('normalizeWebUrl', () => {
  it('adds https to a bare domain', () => {
    expect(normalizeWebUrl('example.com/video')).toBe('https://example.com/video');
  });

  it('keeps an existing scheme', () => {
    expect(normalizeWebUrl(' http://example.com ')).toBe('http://example.com');
  });

  it('returns an empty string for invalid or empty values', () => {
    expect(normalizeWebUrl('javascript://alert(1)')).toBe('');
    expect(normalizeWebUrl('not a url')).toBe('');
    expect(normalizeWebUrl('   ')).toBe('');
  });
});
