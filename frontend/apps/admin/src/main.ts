import { bootstrapApplication } from '@angular/platform-browser';
import { loadAppConfig } from '@care/shared-util-config';
import { App } from './app/app';
import { appConfig } from './app/app.config';

loadAppConfig()
  .then((config) => bootstrapApplication(App, appConfig(config)))
  .catch((err) => console.error(err));
