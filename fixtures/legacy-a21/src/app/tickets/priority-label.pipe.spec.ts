import { PriorityLabelPipe } from './priority-label.pipe';

describe('PriorityLabelPipe', () => {
  it('doi ma uu tien sang nhan tieng Viet', () => {
    const pipe = new PriorityLabelPipe();
    expect(pipe.transform('URGENT')).toBe('Khẩn cấp');
    expect(pipe.transform('LOW')).toBe('Thấp');
  });
});
