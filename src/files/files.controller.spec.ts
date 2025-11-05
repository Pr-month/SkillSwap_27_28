import { FilesController } from './files.controller';

describe('FilesController', () => {
  let controller: FilesController;

  beforeEach(() => {
    controller = new FilesController();
  });

  it('uploadFile returns publicUrl built from req', async () => {
    const file = { filename: 'abc.png' } as unknown as Express.Multer.File;

    const req: any = {
      protocol: 'http',
      get: (h: string) => (h.toLowerCase() === 'host' ? 'localhost:3000' : ''),
    };

    const res = await controller.uploadFile(file, req);

    expect(res).toEqual({
      publicUrl: 'http://localhost:3000/uploads/abc.png',
    });
  });
});
