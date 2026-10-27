import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import {
  NzResultComponent,
  NzResultExtraDirective,
} from 'ng-zorro-antd/result';

@Component({
  selector: 'care-forbidden-page',
  imports: [
    RouterLink,
    TranslocoPipe,
    NzResultComponent,
    NzResultExtraDirective,
    NzButtonComponent,
  ],
  template: `
    <nz-result
      nzStatus="403"
      nzTitle="403"
      [nzSubTitle]="'status.forbidden' | transloco"
    >
      <div nz-result-extra>
        <a nz-button nzType="primary" routerLink="/">{{
          'common.backToHome' | transloco
        }}</a>
      </div>
    </nz-result>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenPage {}

@Component({
  selector: 'care-not-found-page',
  imports: [
    RouterLink,
    TranslocoPipe,
    NzResultComponent,
    NzResultExtraDirective,
    NzButtonComponent,
  ],
  template: `
    <nz-result
      nzStatus="404"
      nzTitle="404"
      [nzSubTitle]="'status.notFound' | transloco"
    >
      <div nz-result-extra>
        <a nz-button nzType="primary" routerLink="/">{{
          'common.backToHome' | transloco
        }}</a>
      </div>
    </nz-result>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
