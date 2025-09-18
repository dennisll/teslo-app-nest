import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";



export const RawHeaders = createParamDecorator((data, ctx: ExecutionContext)=>{

    const req: Request = ctx.switchToHttp().getRequest();

    const {rawHeaders}= req;

    return rawHeaders;
})