import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { File } from "./entities/file.entity";

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
  ) {}

  async saveFile(file: Express.Multer.File, baseUrl: string) {
    const publicUrl = `${baseUrl}/public/${file.filename}`;
    
    const fileRecord = await this.fileRepository.save({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      publicUrl,
      size: file.size,
      mimetype: file.mimetype,
    });

    return {
      publicUrl: fileRecord.publicUrl
    };
  }
}