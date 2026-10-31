import { TicketStatus } from './ticket';
import { canApprove } from './ticket.rules';

describe('canApprove', () => {
  // Đủ 4 trạng thái x 3 nhóm vai trò: thiếu một ô là chỗ lỗi dễ lọt.
  it.each<[TicketStatus, string[], boolean]>([
    ['RESOLVED', ['AGENT', 'SUPERVISOR'], true],
    ['RESOLVED', ['SUPERVISOR'], true],
    ['RESOLVED', ['AGENT'], false],
    ['RESOLVED', [], false],
    ['NEW', ['SUPERVISOR'], false],
    ['IN_PROGRESS', ['SUPERVISOR'], false],
    ['CLOSED', ['SUPERVISOR'], false],
    ['NEW', ['AGENT'], false],
  ])('phieu %s, vai tro %j -> %s', (status, roles, expected) => {
    expect(canApprove({ status }, roles)).toBe(expected);
  });

  it('khong nham ten vai tro gan giong (supervisor viet thuong, SUPERVISOR_X)', () => {
    expect(canApprove({ status: 'RESOLVED' }, ['supervisor'])).toBe(false);
    expect(canApprove({ status: 'RESOLVED' }, ['SUPERVISOR_X'])).toBe(false);
  });
});
