FROM node:15-alpine
WORKDIR /usr/app

RUN apk update && apk add nmap
RUN apk --no-cache add g++ gcc libgcc libstdc++ linux-headers make python

COPY package.json .
COPY package-lock.json .

RUN npm i --quiet
COPY . .
RUN npm run build
CMD ["npm","run","start:prod"]
