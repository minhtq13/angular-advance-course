import { apiPathOf } from './api-url';

const BASE = 'http://localhost:4200/tickets';

describe('apiPathOf', () => {
  it.each([
    [
      'http://localhost:8081/api/tickets',
      'http://localhost:8081',
      '/api/tickets',
    ],
    [
      'http://localhost:8081/api/tickets?page=1',
      'http://localhost:8081',
      '/api/tickets',
    ],
    ['HTTP://LOCALHOST:8081/api/me', 'http://localhost:8081', '/api/me'],
    [
      'https://care.vnpt.vn/care/api/me',
      'https://care.vnpt.vn/care/',
      '/api/me',
    ],
    ['/api/me', '', '/api/me'],
    ['api/me', '', '/api/me'],
  ])('%s thuoc API %s -> %s', (url, apiUrl, path) => {
    expect(apiPathOf(url, apiUrl, BASE)).toBe(path);
  });

  it.each([
    ['http://localhost:8081.evil.com/api/me', 'http://localhost:8081'],
    ['http://localhost:8081@evil.com/api/me', 'http://localhost:8081'],
    ['https://api.care.vn.evil.com/api/me', 'https://api.care.vn'],
    ['http://localhost:8082/api/me', 'http://localhost:8081'],
    ['https://localhost:8081/api/me', 'http://localhost:8081'],
    ['https://care.vnpt.vn/care-evil/api/me', 'https://care.vnpt.vn/care'],
    ['https://cdn.example.com/logo.png', ''],
    ['//evil.com/api/me', ''],
    ['http://[::1', 'http://localhost:8081'],
  ])('%s KHONG thuoc API %s', (url, apiUrl) => {
    expect(apiPathOf(url, apiUrl, BASE)).toBeNull();
  });
});
