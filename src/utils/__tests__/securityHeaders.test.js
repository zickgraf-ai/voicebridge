import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const vercelConfig = JSON.parse(
  readFileSync(resolve(__dirname, '../../../vercel.json'), 'utf-8')
);

const indexHtml = readFileSync(
  resolve(__dirname, '../../../index.html'),
  'utf-8'
);

describe('Security Headers (vercel.json)', () => {
  const globalRule = vercelConfig.headers.find(
    (h) => h.source === '/(.*)'
  );

  it('has a global catch-all header rule', () => {
    expect(globalRule).toBeDefined();
  });

  function headerValue(key) {
    return globalRule?.headers?.find(
      (h) => h.key.toLowerCase() === key.toLowerCase()
    )?.value;
  }

  it('sets Strict-Transport-Security with long max-age', () => {
    const val = headerValue('Strict-Transport-Security');
    expect(val).toBeDefined();
    expect(val).toContain('max-age=');
    expect(val).toContain('includeSubDomains');
  });

  it('sets X-Content-Type-Options to nosniff', () => {
    expect(headerValue('X-Content-Type-Options')).toBe('nosniff');
  });

  it('sets X-Frame-Options to DENY', () => {
    expect(headerValue('X-Frame-Options')).toBe('DENY');
  });

  it('sets Referrer-Policy to strict-origin-when-cross-origin', () => {
    expect(headerValue('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin'
    );
  });

  it('sets Permissions-Policy', () => {
    const val = headerValue('Permissions-Policy');
    expect(val).toBeDefined();
    expect(val).toContain('camera=()');
    expect(val).toContain('microphone=()');
  });
});

describe('Content Security Policy (index.html)', () => {
  it('contains a CSP meta tag', () => {
    expect(indexHtml).toContain('Content-Security-Policy');
  });

  it('restricts default-src to self', () => {
    expect(indexHtml).toMatch(/default-src\s+'self'/);
  });

  it('restricts script-src to self', () => {
    expect(indexHtml).toMatch(/script-src\s+'self'/);
  });

  it('allows inline styles (required by React)', () => {
    expect(indexHtml).toMatch(/style-src\s+'self'\s+'unsafe-inline'/);
  });

  it('blocks object embeds', () => {
    expect(indexHtml).toMatch(/object-src\s+'none'/);
  });

  it('blocks framing via frame-ancestors', () => {
    expect(indexHtml).toMatch(/frame-ancestors\s+'none'/);
  });
});
