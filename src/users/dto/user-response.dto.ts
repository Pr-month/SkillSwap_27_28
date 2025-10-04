import { Gender, UserRole } from '../users.enums';
import { Skill } from '../../skills/entities/skill.entity';

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