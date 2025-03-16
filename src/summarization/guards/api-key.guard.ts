import { CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";


export class ApiKeyGuard implements CanActivate {
    private readonly allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

    canActivate(context: ExecutionContext): boolean {
        const request:Request = context.switchToHttp().getRequest();
        const origin = request.headers.origin;

        if(origin && origin === this.allowedOrigin) {
            return true;
        }

        const authHeader = request.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException("Missing API key")
        }

        const apiKey = authHeader.split(' ')[1]?.trim();

        if(!apiKey) {
            throw new UnauthorizedException("Invalid API key");
        }
        
        (request as any).apiKey = apiKey;

        return true;
    }
}