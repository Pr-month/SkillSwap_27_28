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
  HttpStatus,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AuthRequest } from '../auth/types';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from './entities/request.entity';

@ApiTags('Requests')
@ApiBearerAuth()
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Создание новой заявки на обмен навыками',
    description: 'Создает новую заявку на обмен навыками между пользователями'
  })
  @ApiBody({ type: CreateRequestDto})
  @ApiResponse({
    status: HttpStatus.CREATED, 
    description: 'Заявка успешно создана',
    type: Request
  })
   @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Навык не найден',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Нельзя предлагать чужие навыки',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Неавторизован',
  })
  async create(@Body() dto: CreateRequestDto, @Req() req: AuthRequest) {
    return await this.requestsService.create(dto, req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('incoming')
  @ApiOperation({
    summary: 'Получение входящих заявок',
    description: 'Возвращает список заявок, где текущий пользователь является получателем'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Список входящих заявок',
    type: [Request],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Неавторизован',
  })
  async getIncoming(@Req() req: AuthRequest) {
    return await this.requestsService.getIncoming(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('outgoing')
  @ApiOperation({ 
    summary: 'Получение исходящих заявок',
    description: 'Возвращает список заявок, где текущий пользователь является отправителем'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Список исходящих заявок',
    type: [Request],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Неавторизован',
  })
  async getOutgoing(@Req() req: AuthRequest) {
    return await this.requestsService.getOutgoing(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ 
    summary: 'Обновление заявки',
    description: 'Обновляет статус заявки. Только получатель заявки или администратор могут обновлять'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID заявки',
  })
  @ApiBody({ type: UpdateRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Заявка успешно обновлена',
    type: Request,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Заявка не найдена',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Нет прав для обновления заявки',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Неавторизован',
  })
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
  @ApiOperation({ 
    summary: 'Удаление заявки',
    description: 'Удаляет заявку. Только отправитель заявки или администратор могут удалять'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID заявки',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Заявка успешно удалена',
    schema: {
      example: { message: 'Заявка удалена' }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Заявка не найдена',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Нет прав для удаления заявки',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Неавторизован',
  })
  async remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return await this.requestsService.remove(id, req.user._id, req.user.role);
  }
}
