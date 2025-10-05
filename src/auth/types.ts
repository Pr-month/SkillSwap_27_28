import { UserRole } from '../users/users.enums';

export type JwtPayload = {
  _id: string;
  email: string;
  role: UserRole;
};
