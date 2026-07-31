# Run from /backend directory if use shared service
FROM node

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8001

CMD ["npm", "start"]