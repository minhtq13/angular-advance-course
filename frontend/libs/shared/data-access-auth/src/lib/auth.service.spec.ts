import { userFromClaims } from './auth.service';

describe('userFromClaims', () => {
  it('doc role tu claim "roles" (che do local)', () => {
    const user = userFromClaims({
      preferred_username: 'agent1',
      name: 'Agent One',
      roles: ['AGENT'],
    });

    expect(user).toEqual({
      username: 'agent1',
      displayName: 'Agent One',
      roles: ['AGENT'],
    });
  });

  it('doc role tu "realm_access.roles" (Keycloak) va bo role mac dinh', () => {
    const user = userFromClaims({
      preferred_username: 'admin1',
      realm_access: {
        roles: ['offline_access', 'ADMIN', 'default-roles-care'],
      },
    });

    expect(user.roles).toEqual(['ADMIN']);
    expect(user.displayName).toBe('admin1');
  });
});
