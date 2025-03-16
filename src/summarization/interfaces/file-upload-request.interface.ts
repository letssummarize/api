import { Request } from 'express';

export interface FileUploadRequest extends Request {
    file: Express.Multer.File;
}