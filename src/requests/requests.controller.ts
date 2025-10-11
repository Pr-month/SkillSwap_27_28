import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AuthRequest } from '../auth/types';

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
}
