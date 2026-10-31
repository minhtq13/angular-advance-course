import { APIRequestContext, expect, test } from '@playwright/test';

// Quyền phải được kiểm tra ở server: gọi thẳng API, không qua giao diện (ẩn nút không chứng minh gì).
// Bổ sung cho api-matrix.spec.ts (buổi 6): ở đó đã có "agent gọi /approve -> 403".
const API = process.env['API_URL'] ?? 'http://localhost:8081';
test.use({ baseURL: API });

async function token(request: APIRequestContext, user: string) {
  const res = await request.post('/api/auth/login', {
    data: { username: user, password: user },
  });
  return `Bearer ${(await res.json()).accessToken}`;
}

/** Phiếu mới do agent tạo rồi đánh dấu đã xử lý: đang chờ Manager duyệt. */
async function resolvedTicket(request: APIRequestContext, agent: string) {
  const created = await request.post('/api/tickets', {
    headers: { Authorization: agent },
    data: {
      subscriberId: 1,
      category: 'OTHER',
      priority: 'LOW',
      title: `Kiem tra quyen ${Date.now()}`,
    },
  });
  expect(created.status()).toBe(201);
  const { id, version } = await created.json();
  const resolved = await request.patch(`/api/tickets/${id}`, {
    headers: { Authorization: agent },
    data: { status: 'RESOLVED', version },
  });
  expect(resolved.status()).toBe(200);
  return resolved.json();
}

test('agent khong dong phieu bang PATCH (bo qua buoc duyet) -> 403, phieu khong doi', async ({
  request,
}) => {
  const agent = await token(request, 'agent1');
  const ticket = await resolvedTicket(request, agent);

  const res = await request.patch(`/api/tickets/${ticket.id}`, {
    headers: { Authorization: agent },
    data: { status: 'CLOSED', version: ticket.version },
  });

  expect(res.status()).toBe(403);
  const after = await (
    await request.get(`/api/tickets/${ticket.id}`, {
      headers: { Authorization: agent },
    })
  ).json();
  expect(after).toMatchObject({ status: 'RESOLVED', version: ticket.version });
});

test('manager cung khong dong phieu bang PATCH: dong phieu chi qua /approve', async ({
  request,
}) => {
  const ticket = await resolvedTicket(request, await token(request, 'agent1'));
  const manager = await token(request, 'supervisor1');

  const patch = await request.patch(`/api/tickets/${ticket.id}`, {
    headers: { Authorization: manager },
    data: { status: 'CLOSED', version: ticket.version },
  });
  expect(patch.status()).toBe(403);

  const approve = await request.post(`/api/tickets/${ticket.id}/approve`, {
    headers: { Authorization: manager },
    data: { version: ticket.version },
  });
  expect(approve.status()).toBe(200);
  expect(await approve.json()).toMatchObject({ status: 'CLOSED' });
});
