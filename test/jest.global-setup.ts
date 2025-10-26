import { AppDataSource } from '../src/config/data-source';

export default async function clearDatabase() {
  console.log('Очищаем базу...');
  const ds = await AppDataSource.initialize();
  try {
    await ds.dropDatabase();
    await ds.synchronize();
    console.log('База очищена успешно');
    console.log('Запуск тестов...');
  } catch (err) {
    console.error('Ошибка при очистке базы:', err);
  } finally {
    await ds.destroy();
  }
}
