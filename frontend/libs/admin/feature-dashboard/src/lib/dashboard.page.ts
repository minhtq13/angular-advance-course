import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  AdminApi,
  SUBSCRIBER_STATUS,
  TagLabel,
  TICKET_STATUS,
} from '@care/shared-data-access-api';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  TranslocoDecimalPipe,
  TranslocoPercentPipe,
} from '@jsverse/transloco-locale';
import { NzAlertComponent } from 'ng-zorro-antd/alert';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzSkeletonComponent } from 'ng-zorro-antd/skeleton';

interface StatItem {
  key: string;
  labelKey: string;
  color: TagLabel['color'];
  value: number;
  share: number;
}

interface StatGroup {
  titleKey: string;
  totalKey: string;
  total: number;
  items: StatItem[];
}

function toGroup(
  titleKey: string,
  totalKey: string,
  labels: Record<string, TagLabel>,
  counts: Partial<Record<string, number>>,
): StatGroup {
  const total = Object.keys(labels).reduce(
    (sum, key) => sum + (counts[key] ?? 0),
    0,
  );
  return {
    titleKey,
    totalKey,
    total,
    items: Object.entries(labels).map(([key, { labelKey, color }]) => {
      const value = counts[key] ?? 0;
      return { key, labelKey, color, value, share: total ? value / total : 0 };
    }),
  };
}

@Component({
  selector: 'care-dashboard-page',
  imports: [
    TranslocoPipe,
    TranslocoDecimalPipe,
    TranslocoPercentPipe,
    NzAlertComponent,
    NzButtonComponent,
    NzIconDirective,
    NzSkeletonComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly api = inject(AdminApi);

  protected readonly stats = rxResource({ stream: () => this.api.stats() });

  protected readonly groups = computed<StatGroup[]>(() => {
    if (!this.stats.hasValue()) {
      return [];
    }
    const stats = this.stats.value();
    return [
      toGroup(
        'dashboard.subscribersTitle',
        'dashboard.subscribersTotal',
        SUBSCRIBER_STATUS,
        stats.subscribersByStatus,
      ),
      toGroup(
        'dashboard.ticketsTitle',
        'dashboard.ticketsTotal',
        TICKET_STATUS,
        stats.ticketsByStatus,
      ),
    ];
  });
}
