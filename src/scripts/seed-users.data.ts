import { Gender, UserRole } from '../users/users.enums';

export interface SeedUser {
  name: string;
  email: string;
  password: string;
  about: string;
  birthdate: Date;
  city: string;
  gender: Gender;
  avatar?: string;
  role: UserRole;
}
export const SeedUsers: SeedUser[] = [
  {
    name: 'Иван',
    email: 'ivan@example.com',
    password: 'supersecretpassword123',
    about:
      'Профессиональный графический дизайнер с 5-летним опытом. Специализируюсь на брендинге и веб-дизайне.',
    birthdate: new Date('1992-08-20'),
    city: 'Санкт-Петербург',
    gender: Gender.MALE,
    avatar: 'https://example.com/avatarka.jpg',
    role: UserRole.USER,
  },
  {
    name: 'Виктория',
    email: 'vika@example.com',
    password: 'supersecretpassword123',
    about:
      'Full-stack разработчик с опытом работы с JavaScript, Python и Node.js. Люблю обучать и делиться знаниями.',
    birthdate: new Date('1990-03-10'),
    city: 'Кемерово',
    gender: Gender.FEMALE,
    avatar: 'https://example.com/avatarka.jpg',
    role: UserRole.USER,
  },
  {
    name: 'Мария Козлова',
    email: 'maria@example.com',
    password: 'supersecretpassword123',
    about:
      'Фотограф и ретушер. Снимаю портреты, предметную фотосъемку. Преподаю основы фотографии и обработки.',
    birthdate: new Date('1995-11-05'),
    city: 'Екатеринбург',
    gender: Gender.FEMALE,
    avatar: 'https://example.com/avatarka.jpg',
    role: UserRole.USER,
  },
  {
    name: 'Алексей Петров',
    email: 'alexey@example.com',
    password: 'supersecretpassword123',
    about:
      'Копирайтер и маркетолог. Помогу с написанием продающих текстов и контент-стратегией.',
    birthdate: new Date('1988-07-30'),
    city: 'Казань',
    gender: Gender.MALE,
    avatar: 'https://example.com/avatarka.jpg',
    role: UserRole.USER,
  },
];
