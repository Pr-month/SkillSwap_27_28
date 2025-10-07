import { UserRole } from '../users/users.enums';

export type JwtPayload = {
  _id: number;
  email: string;
  role: UserRole;
};


export type AuthRequest = Request & {
  user: JwtPayload
};