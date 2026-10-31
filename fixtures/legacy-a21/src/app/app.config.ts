import { provideHttpClient, withXhr } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Migration standalone-bootstrap sinh importProvidersFrom(HttpClientModule, AppRoutingModule, ...):
// chạy được nhưng vẫn là API kiểu NgModule. Viết lại bằng provide*.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withXhr()),
    provideRouter(routes),
  ],
};
