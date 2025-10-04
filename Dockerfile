# syntax=docker/dockerfile:1.7

FROM node:20-alpine

ENV CI=1
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:3110
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

ENV NODE_ENV=production

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --spider --no-verbose http://localhost || exit 1

CMD ["npm", "run", "preview"]
