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

export interface SeedSkill {
  title: string;
  description: string;
  images: string[];
  ownerIndex: number;
}

export const getSeedUsers = (hashedPassword: string): SeedUser[] => [
  {
    name: 'Администратор',
    email: process.env.ADMIN_EMAIL || 'admin@skillswap.ru',
    password: hashedPassword,
    about: 'Главный администратор платформы SkillSwap. Отвечаю за работу системы и помощь пользователям.',
    birthdate: new Date('1985-05-15'),
    city: 'Москва',
    gender: Gender.MALE,
    avatar: undefined,
    role: UserRole.ADMIN
  },
  {
    name: 'Иван',
    email: 'ivan@example.com',
    password: hashedPassword,
    about: 'Профессиональный графический дизайнер с 5-летним опытом. Специализируюсь на брендинге и веб-дизайне.',
    birthdate: new Date('1992-08-20'),
    city: 'Санкт-Петербург',
    gender: Gender.MALE,
    avatar: undefined,
    role: UserRole.USER
  },
  {
    name: 'Виктория',
    email: 'vika@example.com',
    password: hashedPassword,
    about: 'Full-stack разработчик с опытом работы с JavaScript, Python и Node.js. Люблю обучать и делиться знаниями.',
    birthdate: new Date('1990-03-10'),
    city: 'Кемерово',
    gender: Gender.FEMALE,
    avatar: undefined,
    role: UserRole.USER
  },
  {
    name: 'Мария Козлова',
    email: 'maria@example.com',
    password: hashedPassword,
    about: 'Фотограф и ретушер. Снимаю портреты, предметную фотосъемку. Преподаю основы фотографии и обработки.',
    birthdate: new Date('1995-11-05'),
    city: 'Екатеринбург',
    gender: Gender.FEMALE,
    avatar: undefined,
    role: UserRole.USER
  },
  {
    name: 'Алексей Петров',
    email: 'alexey@example.com',
    password: hashedPassword,
    about: 'Копирайтер и маркетолог. Помогу с написанием продающих текстов и контент-стратегией.',
    birthdate: new Date('1988-07-30'),
    city: 'Казань',
    gender: Gender.MALE,
    avatar: undefined,
    role: UserRole.USER
  }
];

export const getSeedSkills = (): SeedSkill[] => [
  {
    title: 'Графический дизайн',
    description: 'Создание логотипов, брендбуков, полиграфии и веб-дизайна. Работа с Adobe Photoshop, Illustrator, Figma.',
    images: [],
    ownerIndex: 1 // Иван
  },
  {
    title: 'Веб-дизайн',
    description: 'Проектирование пользовательских интерфейсов и создание прототипов для веб-сайтов и приложений.',
    images: [],
    ownerIndex: 1 // Иван
  },
  {
    title: 'JavaScript разработка',
    description: 'Full-stack разработка на JavaScript: React, Node.js, Express, TypeScript.',
    images: [],
    ownerIndex: 2 // Виктория
  },
  {
    title: 'Python программирование',
    description: 'Разработка на Python: Django, Flask, Data Science, автоматизация задач.',
    images: [],
    ownerIndex: 2 // Виктория
  },
  {
    title: 'Портретная фотография',
    description: 'Съемка портретов в студии и на природе. Работа со светом и композицией.',
    images: [],
    ownerIndex: 3 // Мария
  },
  {
    title: 'Обработка фото в Lightroom',
    description: 'Профессиональная обработка фотографий в Adobe Lightroom: цветокоррекция, ретушь, стилизация.',
    images: [],
    ownerIndex: 3 // Мария
  },
  {
    title: 'Копирайтинг',
    description: 'Написание продающих и информационных текстов для сайтов, соцсетей и рекламы.',
    images: [],
    ownerIndex: 4 // Алексей
  },
  {
    title: 'SMM стратегия',
    description: 'Разработка контент-стратегии для социальных сетей и ведение сообществ.',
    images: [],
    ownerIndex: 4 // Алексей
  }
];