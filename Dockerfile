FROM node:24-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js .
COPY index.html .
COPY index.css .

EXPOSE 8080

CMD ["node", "server.js"]