FROM node:22.14.0
WORKDIR /usr/src/quizbot
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD [ "npm", "start" ]