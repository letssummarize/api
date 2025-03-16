FROM node:20-alpine

RUN apk add --no-cache ffmpeg python3 py3-pip yt-dlp

RUN npm install -g pnpm@10

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile 

COPY . .

COPY .env .env  

EXPOSE 5000

RUN pnpm build

CMD ["pnpm", "start:dev"]