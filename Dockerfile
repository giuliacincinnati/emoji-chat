# syntax=docker/dockerfile:1
   
FROM node:19.7.0-alpine
WORKDIR C:/Users/dbima/Desktop/video-chat-v1-master
COPY . .
RUN yarn install --production
CMD ["node", "server.js"]
EXPOSE 3030