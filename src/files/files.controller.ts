import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('upload')
export class FilesController {
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './public/uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Изображение успешно загружено' })
  @ApiResponse({ status: 400, description: 'Ошибка при загрузке файла' })

  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return {
      publicUrl: `${baseUrl}/uploads/${file.filename}`,
    };
  }
}
