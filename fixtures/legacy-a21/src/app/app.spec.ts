import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { NotificationService } from './shared/notification.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('hien ten ung dung', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Care Portal');
  });

  it('thong bao hien tren man hinh (thay ngx-toastr)', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.autoDetectChanges();
    TestBed.inject(NotificationService).success('Đã duyệt phiếu TK-1', 50);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role=status]')?.textContent).toContain('Đã duyệt phiếu TK-1');
  });
});
