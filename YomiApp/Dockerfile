FROM node:12 AS compile-image

WORKDIR /opt/ng

COPY package.json ./

RUN npm install

COPY . ./

RUN node_modules/.bin/ng build --prod

FROM nginx

VOLUME [ "/data" ]

COPY --from=compile-image /opt/ng/dist/YomiApp /usr/share/nginx/html
