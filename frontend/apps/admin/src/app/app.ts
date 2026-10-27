import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@care/shared-data-access-auth';
import { NavItem, Shell } from '@care/shared-ui-layout';

@Component({
  selector: 'care-root',
  imports: [RouterOutlet, Shell],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly appName = 'Care Admin';
  protected readonly navItems: NavItem[] = [
    { label: 'nav.dashboard', icon: 'bar-chart', route: '/dashboard' },
  ];
}
