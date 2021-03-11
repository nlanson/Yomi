# # # # # # # # #
# BUILD THE APP #
# # # # # # # # #
FROM node:12 AS compile-image

WORKDIR /opt/ng

COPY package.json ./

RUN npm install

COPY . ./


# # # # # # #  #
# HOST THE APP #
#  # # # # # # #
RUN node_modules/.bin/ng build --prod

FROM nginx

VOLUME [ "/usr/share/nginx/html/data" ]

WORKDIR /

COPY --from=compile-image /opt/ng/dist/YomiApp /usr/share/nginx/html

