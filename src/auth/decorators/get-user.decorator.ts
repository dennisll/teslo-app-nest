import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";



export const GetUser = createParamDecorator((data: string, ctx: ExecutionContext)=>{

    // la data la usamos para especificar el o los archivos que queremos devolver
    
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    if(!user) throw new InternalServerErrorException('User not found (request)');

    if(data){
       return user[data];
    }

    return user;
});