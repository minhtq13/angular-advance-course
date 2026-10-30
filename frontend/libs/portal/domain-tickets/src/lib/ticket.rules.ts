import { TicketSummary } from './ticket';

/**
 * Quy tắc hiện nút Duyệt: Manager (SUPERVISOR) và phiếu đã xử lý (RESOLVED).
 * Chỉ là trải nghiệm: quyền thật do API kiểm tra (agent gọi thẳng API vẫn nhận 403).
 * Hàm thuần, không phụ thuộc Angular -> test bằng bảng, chạy trong vài mili giây.
 */
export function canApprove(
  ticket: Pick<TicketSummary, 'status'>,
  roles: readonly string[],
): boolean {
  return roles.includes('SUPERVISOR') && ticket.status === 'RESOLVED';
}
