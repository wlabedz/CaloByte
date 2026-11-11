import { TestBed } from '@angular/core/testing';

import { buildUser } from '../../testing/user-fixtures';
import { ActiveUserService } from './active-user.service';

describe('ActiveUserService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('remembers the selected user after the app is reloaded', () => {
    TestBed.inject(ActiveUserService).select(
      buildUser({ id: 'u1', name: 'Anna', surname: 'Nowak' }),
    );

    TestBed.resetTestingModule();

    expect(TestBed.inject(ActiveUserService).user()).toEqual({
      id: 'u1',
      name: 'Anna Nowak',
      email: buildUser({ id: 'u1' }).email,
    });
  });

  it('starts without a user when the stored value is corrupted', () => {
    localStorage.setItem('calobyte.activeUser', '{"id": 5');

    expect(TestBed.inject(ActiveUserService).user()).toBeNull();
  });

  it('forgets the user on logout', () => {
    TestBed.inject(ActiveUserService).select(buildUser({ id: 'u1' }));
    TestBed.inject(ActiveUserService).logout();

    TestBed.resetTestingModule();

    expect(TestBed.inject(ActiveUserService).user()).toBeNull();
  });
});
