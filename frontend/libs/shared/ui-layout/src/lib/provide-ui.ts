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
 * Xanh mặc định của ng-zorro (#1890ff) chỉ đạt ~3:1 với chữ trắng -> không đạt WCAG AA.
 * #0958d9 đạt 6.2:1; ng-zorro tự sinh các sắc độ hover/active/nền chọn từ màu này
 * (cần dùng ng-zorro-antd.variable.min.css).
 */
const PRIMARY_COLOR = '#0958d9';

/** Chỉ đăng ký icon thực sự dùng -> không kéo cả bộ icon vào bundle (buổi 5). */
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
    // Ngôn ngữ ban đầu; LanguageService (util-i18n) đổi sang en_US khi người dùng chọn English.
    provideNzI18n(vi_VN),
    provideNzIcons(ICONS),
    // Khởi tạo sớm để theme (và CSS dark của ng-zorro) được áp dụng trước khi render.
    provideAppInitializer(() => {
      inject(ThemeService);
    }),
  ]);
}
