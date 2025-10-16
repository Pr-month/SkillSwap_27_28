import { AppDataSource } from '../config/data-source';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { SeedAdmin } from './seed-admin-data';
import { UserRole } from '../users/users.enums';

async function seedUsers() {
  await AppDataSource.initialize();
  const userRepository = AppDataSource.getRepository(User);

  const existingUsers = await userRepository.findOne({
    where: {
      role: UserRole.ADMIN,
    },
  });

  if (existingUsers) {
    console.log('В базе данных уже есть Админ');
    await AppDataSource.destroy();
    return;
  }

  for (const userData of SeedAdmin) {
    const admin = userRepository.create({
      ...userData,
      password: await bcrypt.hash(userData.password, 10),
    });
    await userRepository.save(admin);
    console.log(`✅ Создан админ`);
  }
}

seedUsers().catch((error) => {
  console.error('Ошибка при сидинге админа:', error);
  process.exit(1);
});
