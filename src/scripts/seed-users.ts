import { AppDataSource } from '../config/data-source';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { SeedUsers } from './seed-users.data';
import { Category } from '../categories/entities/category.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
async function seedUsers() {
  await AppDataSource.initialize();
  const userRepository = AppDataSource.getRepository(User);
  const categoryRepository = AppDataSource.getRepository(Category);

  const existingUsers = await userRepository.count();
  const wantToCategory = await categoryRepository.find({ take: 2 });

  if (existingUsers > 0) {
    console.log('В базе данных уже есть пользователи. Сидинг пропущен.');
    await AppDataSource.destroy();
    return;
  } else if (!wantToCategory.length) {
    console.log('В базе данных нет категорий. Запусти сидинг категорий.');
    await AppDataSource.destroy();
    return;
  }

  const createUsersData: CreateUserDto[] = await Promise.all(
    SeedUsers.map(async (user) => {
      try {
        const randomCategories = [
          wantToCategory[Math.floor(Math.random() * wantToCategory.length)],
        ];
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return {
          ...user,
          password: hashedPassword,
          wantToLearn: randomCategories,
        };
      } catch (error) {
        console.error(`Ошибка при обработке пользователя ${user.name}:`, error);
        throw error;
      }
    }),
  );
  for (const userData of createUsersData) {
    const user = userRepository.create(userData);
    const savedUser = await userRepository.save(user);
    console.log(`✅ Создан пользователь: ${savedUser.name}`);
  }
  console.log(`✅ Пользователи добавлены в базу`);
  await AppDataSource.destroy();
}

seedUsers().catch((error) => {
  console.error('Ошибка при сидинге пользователей:', error);
  process.exit(1);
});
