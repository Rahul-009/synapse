# Run from /backend directory if use shared service
FROM node

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8002

CMD ["npm", "start"]