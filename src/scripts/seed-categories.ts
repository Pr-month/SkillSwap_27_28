import { AppDataSource } from '../config';
import { Category } from '../categories/entities/category.entity';

async function seedCategories() {
  await AppDataSource.initialize();
  const categoryRepository = AppDataSource.getRepository(Category);

  const existing = await categoryRepository.count();
  if (existing > 0) {
    await categoryRepository.clear();
  }

  const categories = [
    {
      id: '60839da6-e0cf-4027-a9c6-c09fb0f1f06f',
      name: 'Обучение',
      parent: null,
    },
    {
      id: '7a476e35-b96e-401b-9e00-9540ced48707',
      name: 'Работа по дому',
      parent: null,
    },
    {
      id: 'ef0fd121-f2c4-411d-bca1-9496452ec6c4',
      name: 'Математика',
      parent: { id: '60839da6-e0cf-4027-a9c6-c09fb0f1f06f' } as Category,
    },
    {
      id: '03111b9b-b0ae-4b66-879b-a687c069e27d',
      name: 'Английский',
      parent: { id: '60839da6-e0cf-4027-a9c6-c09fb0f1f06f' } as Category,
    },
    {
      id: '85245f80-f2d8-4ec6-90b4-e481575d072a',
      name: 'Творчество',
      parent: null,
    },
    {
      id: 'd6009a62-3c65-490c-851d-b5198a2d95d2',
      name: 'Игра на гитаре',
      parent: { id: '85245f80-f2d8-4ec6-90b4-e481575d072a' } as Category,
    },
    {
      id: 'cd6c9149-2250-4150-8b25-f1ebc39a7daa',
      name: 'Танцы',
      parent: { id: '85245f80-f2d8-4ec6-90b4-e481575d072a' } as Category,
    },
  ];

  for (const category of categories) {
    const existingCategory = await categoryRepository.findOne({
      where: { id: category.id },
    });
    if (!existingCategory) {
      await categoryRepository.save(category);
    }
  }

  console.log('✅ Сид успешен!');
  await AppDataSource.destroy();
}

seedCategories().catch((error) =>
  console.error('❌ Ошибка при сидинге:', error),
);
