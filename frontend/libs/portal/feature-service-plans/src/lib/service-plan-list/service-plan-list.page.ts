import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  ServicePlanApi,
  SUBSCRIBER_TYPE,
  SubscriberType,
} from '@care/shared-data-access-api';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  TranslocoCurrencyPipe,
  TranslocoDecimalPipe,
} from '@jsverse/transloco-locale';
import { NzAlertComponent } from 'ng-zorro-antd/alert';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzRadioComponent, NzRadioGroupComponent } from 'ng-zorro-antd/radio';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagComponent } from 'ng-zorro-antd/tag';

@Component({
  selector: 'care-service-plan-list-page',
  imports: [
    FormsModule,
    TranslocoPipe,
    TranslocoCurrencyPipe,
    TranslocoDecimalPipe,
    NzAlertComponent,
    NzButtonComponent,
    NzRadioGroupComponent,
    NzRadioComponent,
    NzTableModule,
    NzTagComponent,
  ],
  templateUrl: './service-plan-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicePlanListPage {
  private readonly api = inject(ServicePlanApi);

  protected readonly typeLabels = SUBSCRIBER_TYPE;

  /** null = tat ca loai. */
  protected readonly type = signal<SubscriberType | null>(null);

  // Luu y: params() tra ve undefined => resource o trang thai idle, KHONG goi API.
  // Vi vay boc trong object thay vi tra ve this.type() ?? undefined.
  protected readonly plans = rxResource({
    params: () => ({ type: this.type() }),
    stream: ({ params }) => this.api.list(params.type ?? undefined),
  });

  protected readonly rows = computed(() =>
    this.plans.hasValue() ? this.plans.value() : [],
  );
}
