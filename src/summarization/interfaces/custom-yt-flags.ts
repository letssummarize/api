import { YtFlags } from 'yt-dlp-exec';

export type CustomYtFlags = YtFlags & {
  extractorArgs?: string;
};
