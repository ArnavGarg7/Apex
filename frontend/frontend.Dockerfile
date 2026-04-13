FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# We need to build with VITE_API_BASE_URL empty so it uses relative paths mapped via Nginx
RUN npm run build


FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for React router support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
