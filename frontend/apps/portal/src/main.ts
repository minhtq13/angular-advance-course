import { bootstrapApplication } from '@angular/platform-browser';
import { loadAppConfig, loadAppRelease } from '@care/shared-util-config';
import { App } from './app/app';
import { appConfig } from './app/app.config';

Promise.all([loadAppConfig(), loadAppRelease()])
  .then(([config, release]) =>
    bootstrapApplication(App, appConfig(config, release)),
  )
  .catch((err) => console.error(err));
