import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AuthRequest } from '../auth/types';
import { UpdateRequestDto } from './dto/update-request.dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateRequestDto, @Req() req: AuthRequest) {
    return await this.requestsService.create(dto, req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('incoming')
  async getIncoming(@Req() req: AuthRequest) {
    return await this.requestsService.getIncoming(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('outgoing')
  async getOutgoing(@Req() req: AuthRequest) {
    return await this.requestsService.getOutgoing(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRequestDto,
    @Req() req: AuthRequest,
  ) {
    return await this.requestsService.update(
      id,
      dto,
      req.user._id,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return await this.requestsService.remove(id, req.user._id, req.user.role);
  }
}
