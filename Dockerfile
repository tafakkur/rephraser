FROM node:24-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js .
COPY index.html .
COPY index.css .
COPY banned_terms.txt .
COPY samples.json .

EXPOSE 8080

CMD ["node", "server.js"]