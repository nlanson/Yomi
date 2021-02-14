FROM node:12 AS compile-image

VOLUME [ "/data" ]

WORKDIR /opt/ng

COPY package.json ./

RUN npm install

COPY . ./

RUN node_modules/.bin/ng build --prod

FROM nginx

COPY --from=compile-image /opt/ng/dist/YomiApp /usr/share/nginx/html
