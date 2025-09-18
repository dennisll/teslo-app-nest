import { Reflector } from '@nestjs/core';
import { BadGatewayException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { User } from 'src/auth/entities/user.entity';
import { META_ROLES } from 'src/auth/decorators';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    // el reflector permite obtener la metadata de otros decoradores, en este caso de 
    // RoleProtected, asi podemos evaluar si los roles del usuario coinciden con los roles
    // definidos en la metadata, si coinciden devolvemos true, si no devolvemos una excepcion

    const validRoles: string [] = this.reflector.get(META_ROLES, context.getHandler());

    if (!validRoles || validRoles.length === 0){
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user as User;

    if(!user) throw new BadGatewayException('User not found');

    for( const role of user.roles){
      if(validRoles.includes(role)){
        return true;
      }
    }

    throw new ForbiddenException(`User ${user.fullName} need  a valid role: [${validRoles}]`)
  }
}
