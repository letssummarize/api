import { ParseFilePipeBuilder, HttpStatus } from '@nestjs/common';

export const FILE_VALIDATORS = [
  new ParseFilePipeBuilder()
    .addFileTypeValidator({
      fileType: 'pdf',
    })
    .addFileTypeValidator({
        fileType: 'docx'
    })
    .addFileTypeValidator({
      fileType: 'txt'
    })
    .addMaxSizeValidator({
      maxSize: 1000 * 1024, 
    })
    .build({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
];