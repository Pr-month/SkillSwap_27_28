import { AppDataSource } from '../config';
import { SkillsData } from './seed-skills-data';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';

function getRandomUser(users: User[]): User {
  return users[Math.floor(Math.random() * users.length)];
}

async function seedSkills() {
  await AppDataSource.initialize();
  const skillsRepo = AppDataSource.getRepository(Skill);
  const usersRepo = AppDataSource.getRepository(User);

  const users = await usersRepo.find({});
  if (users.length === 0) {
    console.error(
      '❌ Не найден ни один пользователь. Запусти сид для создания пользователей.',
    );
    await AppDataSource.destroy();
    return;
  }

  console.log(users);
  for (const skill of SkillsData) {
    const randomOwner = getRandomUser(users);
    await skillsRepo.save({ ...skill, owner: randomOwner });
  }
  console.log('✅ Сид успешен!');
  await AppDataSource.destroy();
}
seedSkills().catch((error) => console.error('❌ Ошибка при сидинге:', error));
