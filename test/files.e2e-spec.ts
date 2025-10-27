jest.setTimeout(20000);

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsp } from 'fs';

import { FilesModule } from '../src/files/files.module';

describe('E2E /upload (FilesController)', () => {
  let app: INestApplication;
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  const fixturePath = path.resolve(
    process.cwd(),
    'test',
    'fixtures',
    'sample.jpg',
  );

  beforeAll(async () => {
    await fsp.mkdir(uploadsDir, { recursive: true });

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [FilesModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const extractFilenameFromPublicUrl = (publicUrl: string) => {
    const idx = publicUrl.lastIndexOf('/');
    return publicUrl.slice(idx + 1);
  };

  it('POST /upload — успешно загружает файл и возвращает publicUrl', async () => {
    const host = 'example.com';

    const res = await request(app.getHttpServer())
      .post('/upload')
      .set('Host', host)
      .attach('image', fixturePath)
      .expect(201);

    expect(res.body).toHaveProperty('publicUrl');
    expect(typeof res.body.publicUrl).toBe('string');
    expect(res.body.publicUrl.startsWith(`http://${host}/uploads/`)).toBe(true);

    const savedName = extractFilenameFromPublicUrl(res.body.publicUrl);
    const savedPath = path.join(uploadsDir, savedName);

    expect(fs.existsSync(savedPath)).toBe(true);

    await fsp.unlink(savedPath).catch(() => void 0);
  });

  it('POST /upload — ошибка, если файл не передан', async () => {
    const res = await request(app.getHttpServer())
      .post('/upload')
      .set('Host', 'example.com')
      .expect(500);

    expect([400, 500]).toContain(res.status);
  });
});
