import { AppDataSource } from '../config/data-source';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import * as bcrypt from 'bcrypt';
import { getSeedSkills, getSeedUsers } from './seed-users.data';

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

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const userPassword = 'password123';

    // Хешируем пароли
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    const hashedUserPassword = await bcrypt.hash(userPassword, 10);;

    // Получаем данные пользователей
    const usersData = getSeedUsers(hashedUserPassword).map((user, index) => {
        // Для администратора используем специальный пароль из env
        if (index === 0) {
            return { ...user, password: hashedAdminPassword };
        }
        return user;
    });
    
    // Создаем и сохраняем пользователей по одному
    const savedUsers: User[] = [];
    for (const userData of usersData) {
        const user = userRepository.create(userData);
        const savedUser = await userRepository.save(user);
        savedUsers.push(savedUser);
        console.log(`✅ Создан пользователь: ${savedUser.name}`);
    }

    // Получаем данные навыков
    const skillsData = getSeedSkills();
    
    // Создаем и сохраняем навыки
    for (const skillData of skillsData) {
        const skill = skillRepository.create({
            ...skillData,
            owner: savedUsers[skillData.ownerIndex]
        });
        await skillRepository.save(skill);
        console.log(`Создан навык: ${skill.title} для ${skill.owner.name}`);
    }

    console.log('Сидинг пользователей успешно завершен!');

    await AppDataSource.destroy();
}

seedUsers().catch((error) => {
    console.error('Ошибка при сидинге пользователей:', error);
    process.exit(1);
});