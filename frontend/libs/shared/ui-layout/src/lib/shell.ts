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
  /** Key dịch, vd 'nav.subscribers'. */
  label: string;
  /** Tên icon ant-design, vd 'team'. Icon phải được đăng ký qua provideNzIcons. */
  icon: string;
  route: string;
}

/** Từ 992px (breakpoint lg của ng-zorro) trở lên: menu cố định bên trái; nhỏ hơn: menu trong drawer. */
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
  /** Key dịch của vai trò, vd 'roles.AGENT'. */
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

  // #main nằm trên component nz-content -> phải đọc ElementRef, nếu không sẽ nhận instance component.
  private readonly main = viewChild.required('main', {
    read: ElementRef<HTMLElement>,
  });

  constructor() {
    // Đổi trang -> đưa focus về nội dung chính để người dùng bàn phím / trình đọc màn hình
    // bắt đầu từ đầu trang mới (bỏ qua lần điều hướng đầu tiên khi mở app).
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => {
        // Drawer (điện thoại) tự đóng khi điều hướng và trả focus về nút menu sau animation 300ms
        // (NzDrawerComponent.close) -> đợi qua mốc đó rồi mới đưa focus vào nội dung chính.
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
