import 'server-only';
import { db } from './db';
import { hashPassword } from './password';

export type Role = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  salon: string;
  role: Role;
  /** Product slugs unlocked by redeemed product keys. Content access is derived from this list only. */
  entitlements: string[];
  createdAt: Date;
}

type UserRow = User & { passwordHash: string };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const toUser = ({ passwordHash, ...user }: UserRow): User => user;

export async function findUserById(id: string): Promise<User | null> {
  const [row] = await db()<UserRow[]>`select * from users where id = ${id}`;
  return row ? toUser(row) : null;
}

/** The user plus their password hash — for login only. */
export async function findUserForLogin(email: string) {
  const [row] = await db()<UserRow[]>`select * from users where email = ${email.toLowerCase()}`;
  return row ? { user: toUser(row), passwordHash: row.passwordHash } : null;
}

export async function getCustomers(): Promise<User[]> {
  const rows = await db()<UserRow[]>`select * from users where role = 'customer' order by created_at desc`;
  return rows.map(toUser);
}

/** Creates a customer account. Returns null if the email is already registered. */
export async function createCustomer(input: { name: string; email: string; salon: string; password: string }) {
  const [row] = await db()<UserRow[]>`
    insert into users (name, email, salon, password_hash)
    values (${input.name}, ${input.email.toLowerCase()}, ${input.salon}, ${hashPassword(input.password)})
    on conflict (email) do nothing
    returning *`;
  return row ? toUser(row) : null;
}
