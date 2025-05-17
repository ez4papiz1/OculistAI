FROM node:18

WORKDIR /code

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host"]
