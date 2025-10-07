import { Module } from "@nestjs/common";
import { FilesController } from "./files.controller";
import { MulterModule } from "@nestjs/platform-express";

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fieldSize: 2 * 1024 * 1024 // 2MB
      }
    })
  ],
  controllers: [FilesController],
})
export class FilesModule {}