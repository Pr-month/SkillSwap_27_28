import { UserRole } from '../users/users.enums';
import { Gender } from '../users/users.enums';
import { SeedUser } from './seed-users.data';

export const SeedAdmin: SeedUser[] = [
  {
    name: 'Администратор',
    email: process.env.ADMIN_EMAIL || 'admin@skillswap.ru',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    about:
      'Главный администратор платформы SkillSwap. Отвечаю за работу системы и помощь пользователям.',
    birthdate: new Date('1985-05-15'),
    city: 'Москва',
    gender: Gender.MALE,
    avatar: 'https://example.com/avatarkaBoss.jpg',
    role: UserRole.ADMIN,
  },
];
