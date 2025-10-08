import { AppDataSource } from '../config/data-source';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Gender, UserRole } from '../users/users.enums';
import * as bcrypt from 'bcrypt';

async function seedUsers() {
    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);
    const skillRepository = AppDataSource.getRepository(Skill);

    // Проверяем, есть ли уже пользователи
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
        console.log('В базе данных уже есть пользователи. Сидинг пропущен.');
        await AppDataSource.destroy();
        return;
    }

    // Хешируем пароль для всех пользователей
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Создаем пользователей через create (правильный способ)
    const usersToCreate = [
        {
            name: 'Администратор',
            email: 'admin@skillswap.ru',
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

    // Создаем и сохраняем пользователей по одному
    const savedUsers: User[] = [];
    for (const userData of usersToCreate) {
        const user = userRepository.create(userData);
        const savedUser = await userRepository.save(user);
        savedUsers.push(savedUser);
        console.log(`✅ Создан пользователь: ${savedUser.name}`);
    }

    // Создаем навыки для пользователей
    const skillsData = [
        {
            title: 'Графический дизайн',
            description: 'Создание логотипов, брендбуков, полиграфии и веб-дизайна. Работа с Adobe Photoshop, Illustrator, Figma.',
            images: [],
            owner: savedUsers[1] // Анна
        },
        {
            title: 'Веб-дизайн',
            description: 'Проектирование пользовательских интерфейсов и создание прототипов для веб-сайтов и приложений.',
            images: [],
            owner: savedUsers[1] // Анна
        },
        {
            title: 'JavaScript разработка',
            description: 'Full-stack разработка на JavaScript: React, Node.js, Express, TypeScript.',
            images: [],
            owner: savedUsers[2] // Петр
        },
        {
            title: 'Python программирование',
            description: 'Разработка на Python: Django, Flask, Data Science, автоматизация задач.',
            images: [],
            owner: savedUsers[2] // Петр
        },
        {
            title: 'Портретная фотография',
            description: 'Съемка портретов в студии и на природе. Работа со светом и композицией.',
            images: [],
            owner: savedUsers[3] // Мария
        },
        {
            title: 'Обработка фото в Lightroom',
            description: 'Профессиональная обработка фотографий в Adobe Lightroom: цветокоррекция, ретушь, стилизация.',
            images: [],
            owner: savedUsers[3] // Мария
        },
        {
            title: 'Копирайтинг',
            description: 'Написание продающих и информационных текстов для сайтов, соцсетей и рекламы.',
            images: [],
            owner: savedUsers[4] // Алексей
        },
        {
            title: 'SMM стратегия',
            description: 'Разработка контент-стратегии для социальных сетей и ведение сообществ.',
            images: [],
            owner: savedUsers[4] // Алексей
        }
    ];

    // Создаем и сохраняем навыки
    for (const skillData of skillsData) {
        const skill = skillRepository.create(skillData);
        await skillRepository.save(skill);
        console.log(`✅ Создан навык: ${skill.title} для ${skill.owner.name}`);
    }

    console.log('Сидинг пользователей успешно завершен!');
    console.log('Создано:');
    console.log('   - 1 администратор');
    console.log('   - 4 обычных пользователя');
    console.log('   - 8 навыков');
    console.log('Данные для входа (для всех пользователей):');
    console.log('   Email: указанный в профиле');
    console.log('   Password: password123');
    console.log('Администратор: admin@skillswap.ru');
    console.log('Обычные пользователи: anna@example.com, petr@example.com, maria@example.com, alexey@example.com');

    await AppDataSource.destroy();
}

seedUsers().catch((error) => {
    console.error('Ошибка при сидинге пользователей:', error);
    process.exit(1);
});