import { Gender, UserRole } from '../users.enums';

export class UserResponseDto {
  id: number;
  name: string;
  email: string;
  about: string;
  birthdate: Date;
  city: string;
  gender: Gender;
  avatar: string;
  skills: string[];
  // favoriteSkills: Skill[];
  role: UserRole;
}
