import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, LoginUserDto } from './dto';
import { CustomJwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('ProductService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

  async create(createUserDto: CreateUserDto) {

    const { password, ...userData } = createUserDto;
    try {
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });
      await this.userRepository.save(user);

      const { password: _, ...restUser } = user;

      return {
        ...restUser,
        token: this.getJwtToken({id: restUser.id})
      };

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, isActive: true, id: true}, //solo va a devolver estas propiedades
    });

    if (!user) throw new UnauthorizedException('Incorrect credentials');

    if (!user.isActive) throw new BadRequestException('Account not active');

    const isMatching = bcrypt.compareSync(password, user.password);
    if (!isMatching) throw new BadRequestException('Incorrect credentials');

    const { password: _, ...restUser } = user;

    return {
      ...restUser,
      token: this.getJwtToken({id: restUser.id})
    };

  }

  checkAuthStatus(user: User) {

    const { password: _, ...restUser } = user;

    return {
      ...restUser,
      token: this.getJwtToken({id: restUser.id})
    };

  }

  private getJwtToken(payload: CustomJwtPayload){
    const token =  this.jwtService.sign(payload);
    return token;
  }

  private handleDBExceptions(error: any): never {

    console.log(error.code);
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);

    throw new InternalServerErrorException(
      'Unexpected Error, check server logs',
    );
  }
}
