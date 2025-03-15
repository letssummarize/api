import { ParseFilePipeBuilder, HttpStatus } from '@nestjs/common';

export const FILE_VALIDATOR_PIPE = new ParseFilePipeBuilder()
  .addFileTypeValidator({
    fileType: /^(application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain)$/i,
  })
  .addMaxSizeValidator({
    maxSize: 5 * 1024 * 1024, // 5MB
  })
  .build({
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  });
