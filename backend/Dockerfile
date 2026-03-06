FROM node:18-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY src ./src

ENV PORT=4000
EXPOSE 4000

CMD ["sh", "-c", "npm run db:migrate && npm start"]

