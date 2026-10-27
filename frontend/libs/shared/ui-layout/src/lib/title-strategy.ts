import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, combineLatest, map, of, switchMap } from 'rxjs';

/**
 * Tieu de tab = "<title cua route> · <ten app trong index.html>", vd "Thuê bao · Care Portal".
 * `title` tren route la KEY dich (vd 'title.subscribers'); doi ngon ngu -> tieu de tu doi theo.
 */
@Injectable()
export class CareTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly transloco = inject(TranslocoService);
  private readonly appTitle = this.title.getTitle();
  private readonly pageKey = new BehaviorSubject<string | undefined>(undefined);

  constructor() {
    super();
    combineLatest([this.pageKey, this.transloco.langChanges$])
      .pipe(
        switchMap(([key]) =>
          key ? this.transloco.selectTranslate<string>(key) : of(undefined),
        ),
        map((page) => (page ? `${page} · ${this.appTitle}` : this.appTitle)),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((text) => this.title.setTitle(text));
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.pageKey.next(this.buildTitle(snapshot));
  }
}
