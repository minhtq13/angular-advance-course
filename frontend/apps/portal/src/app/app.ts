import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@care/shared-data-access-auth';
import { NavItem, Shell } from '@care/shared-ui-layout';
import { APP_CONFIG } from '@care/shared-util-config';

@Component({
  selector: 'care-root',
  imports: [RouterOutlet, Shell],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly config = inject(APP_CONFIG);
  protected readonly appName = 'Care Portal';
  protected readonly navItems: NavItem[] = [
    { label: 'nav.subscribers', icon: 'team', route: '/subscribers' },
    { label: 'nav.tickets', icon: 'file-text', route: '/tickets' },
    { label: 'nav.servicePlans', icon: 'appstore', route: '/service-plans' },
  ];
}
