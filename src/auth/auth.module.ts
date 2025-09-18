import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategies';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  /*
  el ConfigModule es importado aca solo con fines educativos, no es necesario, ya que podemos 
  acceder directamente a las variables de entorno a traves de process
  */
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],  //inyectamos el ConfigService y 
      // lo usamos luego en la funcion de abajo
      useFactory: (configService: ConfigService) => {
  
          //console.log('JWT_SECRET:', process.env.JWT_SECRET);
        return {
          //secret: process.env.JWT_SECRET,
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '2h',
          },
        };
      },
    }),

    /* JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions:{
        expiresIn: '2h'
      }
    }) */
  ],
  exports: [TypeOrmModule, JwtStrategy, PassportModule, JwtModule]
})
export class AuthModule {}
