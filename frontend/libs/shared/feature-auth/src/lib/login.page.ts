import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { LocalAuthService, safeReturnUrl } from '@care/shared-data-access-auth';
import { problemMessage } from '@care/shared-data-access-api';
import { LanguageSwitcher, ThemeSwitcher } from '@care/shared-ui-layout';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NzAlertComponent } from 'ng-zorro-antd/alert';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  NzInputDirective,
  NzInputPasswordDirective,
  NzInputWrapperComponent,
} from 'ng-zorro-antd/input';

@Component({
  selector: 'care-login-page',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    LanguageSwitcher,
    ThemeSwitcher,
    NzAlertComponent,
    NzButtonComponent,
    NzFormModule,
    NzInputDirective,
    NzInputWrapperComponent,
    NzInputPasswordDirective,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(LocalAuthService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  /** Bind tu query param ?returnUrl= nho withComponentInputBinding(). */
  readonly returnUrl = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly usernameInput =
    viewChild.required<ElementRef<HTMLInputElement>>('usernameInput');

  constructor() {
    // Trang chi co mot muc dich -> dat san con tro vao o dau tien.
    afterNextRender(() => this.usernameInput().nativeElement.focus());
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.auth.loginWithPassword(username, password).subscribe({
      next: () => this.router.navigateByUrl(safeReturnUrl(this.returnUrl())),
      error: (err) => {
        this.error.set(
          problemMessage(err, this.transloco.translate('auth.failed')),
        );
        this.submitting.set(false);
      },
    });
  }
}
