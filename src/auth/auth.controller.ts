import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Headers, Header, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { RawHeaders } from './decorators/getraw-headers.decorator';
import type { IncomingHttpHeaders } from 'http';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { Auth, RoleProtected } from './decorators';
import { ValidRoles } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-status')
  @Auth()
  checkAuthStatus(
    @GetUser() user: User
  ){
    return this.authService.checkAuthStatus(user);
  }

  @Get('private')
  // el AuthGuard usa la estrategia definida en passport-jwt por defecto, en este caso ,
  // esta usando la estrategia personalizada que implementa la estrategia por defecto,
  //lo cual se activa implementado el super() en el constructor de nuestra estrategia
  //  personalizada

  @SetMetadata('roles', ['admin', 'super-user']) 
  // nest usa la instancia del UserRoleGuard, creada por defecto
  @UseGuards( AuthGuard(), UserRoleGuard)  
  testingPrivateRoute(
    @GetUser() user: User,
    @GetUser('email') email: string,
   // @RawHeaders() rawHeaders: string [],
    //@Headers() headers: IncomingHttpHeaders
  ){
    return {
      ok: true,
      user,
      email,
      //rawHeaders,
      //headers
    }
  }

  @Get('private2')
  @RoleProtected(ValidRoles.user) 
  @UseGuards( AuthGuard(), UserRoleGuard)  
  testingPrivateRoute2(
    @GetUser() user: User,
    @GetUser('email') email: string,
  ){
    return {
      ok: true,
      user,
      email,
    }
  }

  @Get('private3')
  @Auth(ValidRoles.admin) 
  testingPrivateRoute3(
    @GetUser() user: User,
    @GetUser('email') email: string,
  ){
    return {
      ok: true,
      user,
      email,
    }
  }
}
