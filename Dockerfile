# client/Dockerfile
# Multi-stage build: compiles the Vite/React app, then serves the static
# build output with nginx. Used for deploying the frontend to Google Cloud Run.

# --- Build stage ---
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# VITE_API_URL is baked in at build time (Vite env vars are compile-time)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Serve stage ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
