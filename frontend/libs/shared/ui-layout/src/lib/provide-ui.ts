import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { TitleStrategy } from '@angular/router';
import {
  AppstoreOutline,
  ArrowLeftOutline,
  BarChartOutline,
  CustomerServiceOutline,
  DesktopOutline,
  DownOutline,
  FileTextOutline,
  LockOutline,
  LogoutOutline,
  MenuOutline,
  MoonOutline,
  ReloadOutline,
  SearchOutline,
  StopOutline,
  SunOutline,
  TeamOutline,
  UnlockOutline,
} from '@ant-design/icons-angular/icons';
import { provideNzConfig } from 'ng-zorro-antd/core/config';
import { vi_VN, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { ThemeService } from './theme.service';
import { CareTitleStrategy } from './title-strategy';

/**
 * Xanh mac dinh cua ng-zorro (#1890ff) chi dat ~3:1 voi chu trang -> khong dat WCAG AA.
 * #0958d9 dat 6.2:1; ng-zorro tu sinh cac sac do hover/active/nen chon tu mau nay
 * (can dung ng-zorro-antd.variable.min.css).
 */
const PRIMARY_COLOR = '#0958d9';

/** Chi dang ky icon thuc su dung -> khong keo ca bo icon vao bundle (buoi 5). */
const ICONS = [
  AppstoreOutline,
  ArrowLeftOutline,
  BarChartOutline,
  CustomerServiceOutline,
  DesktopOutline,
  DownOutline,
  FileTextOutline,
  LockOutline,
  LogoutOutline,
  MenuOutline,
  MoonOutline,
  ReloadOutline,
  SearchOutline,
  StopOutline,
  SunOutline,
  TeamOutline,
  UnlockOutline,
];

export function provideUi(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: TitleStrategy, useClass: CareTitleStrategy },
    provideNzConfig({ theme: { primaryColor: PRIMARY_COLOR } }),
    // Ngon ngu ban dau; LanguageService (util-i18n) doi sang en_US khi nguoi dung chon English.
    provideNzI18n(vi_VN),
    provideNzIcons(ICONS),
    // Khoi tao som de theme (va CSS dark cua ng-zorro) duoc ap dung truoc khi render.
    provideAppInitializer(() => {
      inject(ThemeService);
    }),
  ]);
}
