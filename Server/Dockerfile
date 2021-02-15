FROM node:12

VOLUME [ "/data" ]

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . ./

CMD [ "node", "dist/index.js" ]