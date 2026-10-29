import { BreakpointObserver } from '@angular/cdk/layout';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzAvatarComponent } from 'ng-zorro-antd/avatar';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import {
  NzDrawerComponent,
  NzDrawerContentDirective,
} from 'ng-zorro-antd/drawer';
import {
  NzDropdownDirective,
  NzDropdownMenuComponent,
} from 'ng-zorro-antd/dropdown';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import {
  NzContentComponent,
  NzHeaderComponent,
  NzLayoutComponent,
  NzSiderComponent,
} from 'ng-zorro-antd/layout';
import {
  NzMenuDirective,
  NzMenuDividerDirective,
  NzMenuItemComponent,
} from 'ng-zorro-antd/menu';
import { NzTagComponent } from 'ng-zorro-antd/tag';
import { filter, map, skip } from 'rxjs';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';

export interface NavItem {
  /** Key dich, vd 'nav.subscribers'. */
  label: string;
  /** Ten icon ant-design, vd 'team'. Icon phai duoc dang ky qua provideNzIcons. */
  icon: string;
  route: string;
}

/** Tu 992px (breakpoint lg cua ng-zorro) tro len: menu co dinh ben trai; nho hon: menu trong drawer. */
const DESKTOP = '(min-width: 992px)';
const DRAWER_CLOSE_MS = 350;

@Component({
  selector: 'care-shell',
  imports: [
    NgTemplateOutlet,
    TranslocoPipe,
    LanguageSwitcher,
    ThemeSwitcher,
    RouterLink,
    RouterLinkActive,
    NzLayoutComponent,
    NzHeaderComponent,
    NzSiderComponent,
    NzContentComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NzMenuDividerDirective,
    NzIconDirective,
    NzAvatarComponent,
    NzButtonComponent,
    NzDrawerComponent,
    NzDrawerContentDirective,
    NzDropdownDirective,
    NzDropdownMenuComponent,
    NzTagComponent,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  readonly appName = input.required<string>();
  readonly navItems = input<NavItem[]>([]);
  readonly userName = input('');
  /** Key dich cua vai tro, vd 'roles.AGENT'. */
  readonly roles = input<string[]>([]);
  readonly environmentName = input<string>();
  readonly logout = output<void>();

  protected readonly isDesktop = toSignal(
    inject(BreakpointObserver)
      .observe(DESKTOP)
      .pipe(map((state) => state.matches)),
    { initialValue: true },
  );
  protected readonly navOpen = signal(false);

  // #main nam tren component nz-content -> phai doc ElementRef, neu khong se nhan instance component.
  private readonly main = viewChild.required('main', {
    read: ElementRef<HTMLElement>,
  });

  constructor() {
    // Doi trang -> dua focus ve noi dung chinh de nguoi dung ban phim / trinh doc man hinh
    // bat dau tu dau trang moi (bo qua lan dieu huong dau tien khi mo app).
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => {
        // Drawer (dien thoai) tu dong khi dieu huong va tra focus ve nut menu sau animation 300ms
        // (NzDrawerComponent.close) -> doi qua moc do roi moi dua focus vao noi dung chinh.
        const delay = this.navOpen() ? DRAWER_CLOSE_MS : 0;
        this.navOpen.set(false);
        setTimeout(() => this.focusMain(), delay);
      });
  }

  private focusMain(): void {
    this.main().nativeElement.focus({ preventScroll: true });
  }

  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
