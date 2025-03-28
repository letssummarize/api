import { CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { STTModel, SummarizationModel, SummarizationSpeed } from "../enums/summarization-options.enum";
import { ALLOWED_ORIGINS } from 'src/utils/constants';

export class ApiKeyGuard implements CanActivate {
    private readonly allowedOrigins: string[] = ALLOWED_ORIGINS;

    canActivate(context: ExecutionContext): boolean {
        console.log('allowedOrigins ', this.allowedOrigins)
        const request:Request = context.switchToHttp().getRequest();
        const origin = request.headers.origin;

        if(origin && this.allowedOrigins.includes(origin)) {
            return true;
        }

        const { options } = request.body;
        const { model, sttModel, speed, listen } = options;


        // Special case for Gemini with fast speed and no listen
        if (model === SummarizationModel.GEMENI && speed === SummarizationSpeed.FAST && !listen) {
            return true;
        }

        // Special case for Gemini with slow speed and Fast-Whisper STT model and no listen
        if(model === SummarizationModel.GEMENI && speed === SummarizationSpeed.SLOW && sttModel === STTModel.FAST_WHISPER && !listen) {
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