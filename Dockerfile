FROM node:16-alpine3.15

RUN apk add --no-cache \
    msttcorefonts-installer font-noto fontconfig \
    freetype ttf-dejavu ttf-droid ttf-freefont ttf-liberation \
    chromium \
  && rm -rf /var/cache/apk/* /tmp/*

RUN update-ms-fonts \
    && fc-cache -f

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .