import { NewUser, User } from '../app/core/models';

export const NEW_USER: NewUser = {
  name: 'Anna',
  surname: 'Nowak',
  email: 'anna@example.com',
  birth_date: '1998-04-12',
  weight_kg: 62,
  height_cm: 168,
  activity: 'moderate',
  sex: 'female',
};

export function buildUser(overrides: Partial<User> & Pick<User, 'id'>): User {
  return { ...NEW_USER, bmi: 22, created_at: '2026-11-07T10:00:00Z', ...overrides };
}
