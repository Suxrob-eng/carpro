FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Production build qilish
RUN npm run build

# Nginx bilan production image
FROM nginx:alpine

# Build qilingan fayllarni Nginx ga ko'chirish
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]