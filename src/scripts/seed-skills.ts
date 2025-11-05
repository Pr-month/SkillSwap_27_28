import { AppDataSource } from '../config';
import { SkillsData } from './seed-skills-data';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { Not } from 'typeorm';
import { UserRole } from '../users/users.enums';

async function seedSkills() {
  await AppDataSource.initialize();
  const skillsRepo = AppDataSource.getRepository(Skill);
  const usersRepo = AppDataSource.getRepository(User);

  const users = await usersRepo.find({
    where: {
      role: Not(UserRole.ADMIN),
    },
    take: 2,
  });
  if (users.length === 0) {
    console.error(
      '❌ Не найден ни один пользователь. Запусти сид для создания пользователей.',
    );
    await AppDataSource.destroy();
    return;
  }
  let toggle: 0 | 1 = 0;
  for (const skill of SkillsData) {
    function getOneSkill(): 0 | 1 {
      toggle = (1 - toggle) as 0 | 1;
      return toggle;
    }
    await skillsRepo.save({ ...skill, owner: users[getOneSkill()] }); // Чередуется Owner: 1 из 2х пользователей
  }
  console.log('✅ Сид успешен!');
  await AppDataSource.destroy();
}
seedSkills().catch((error) => console.error('❌ Ошибка при сидинге:', error));
