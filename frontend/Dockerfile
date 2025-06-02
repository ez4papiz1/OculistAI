FROM node:18

WORKDIR /code

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 5173
CMD ["npm", "run", "dev" "preview", "--", "--host"]
