import { AppDataSource } from '../config';
import { Category } from '../categories/entities/category.entity';
import { CategoriesData } from './seed-categories-data';

async function seedCategories() {
  await AppDataSource.initialize();
  const categoryRepository = AppDataSource.getRepository(Category);

  const existing = await categoryRepository.count();
  if (existing > 0) {
    await AppDataSource.destroy();
    console.log('Данные в таблице уже есть');
    return;
  }

  const allCategories: Category[] = [];
  for (const category of CategoriesData) {
    const parentCategory = new Category();
    parentCategory.name = category.name;
    await categoryRepository.save(parentCategory);
    allCategories.push(parentCategory);

    for (const childName of category.children) {
      const childCategory = new Category();
      childCategory.name = childName;
      await categoryRepository.save(childCategory);
      allCategories.push(childCategory);
    }
  }

  for (const category of CategoriesData) {
    const parent = allCategories.find((c) => c.name === category.name);
    for (const childName of category.children) {
      const child = allCategories.find((c) => c.name === childName);
      if (parent && child) {
        child.parent = parent;
        await categoryRepository.save(child);
      }
    }
  }

  console.log('✅ Сид успешен!');
  await AppDataSource.destroy();
}

seedCategories().catch((error) =>
  console.error('❌ Ошибка при сидинге:', error),
);
