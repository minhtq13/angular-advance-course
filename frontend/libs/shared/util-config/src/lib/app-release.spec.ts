import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { loadAppRelease, provideAppRelease } from './app-release';

function mockFetch(body: string, init: ResponseInit = { status: 200 }) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(body, init));
}

describe('loadAppRelease', () => {
  afterEach(() => vi.restoreAllMocks());

  it('doc version va commit tu version.json cua image', async () => {
    const fetch = mockFetch('{"version":"1.1.0","commit":"3f2c9ab"}');

    await expect(loadAppRelease()).resolves.toEqual({
      version: '1.1.0',
      commit: '3f2c9ab',
    });
    expect(fetch).toHaveBeenCalledWith('/version.json', { cache: 'no-cache' });
  });

  it('dev server khong co version.json (tra index.html) -> dev, khong lam hong khoi dong', async () => {
    mockFetch('<!doctype html><html></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });

    await expect(loadAppRelease()).resolves.toEqual({
      version: 'dev',
      commit: 'local',
    });
  });

  it('404 -> dev', async () => {
    mockFetch('not found', { status: 404 });

    await expect(loadAppRelease()).resolves.toEqual({
      version: 'dev',
      commit: 'local',
    });
  });
});

describe('provideAppRelease', () => {
  it('loi chua bat duoc ghi kem version de loc theo ban phat hanh', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [provideAppRelease({ version: '1.1.0', commit: '3f2c9ab' })],
    });
    const error = new TypeError('x is undefined');

    TestBed.inject(ErrorHandler).handleError(error);

    expect(log).toHaveBeenCalledWith('[care-portal 1.1.0 3f2c9ab]', error);
    log.mockRestore();
  });
});
