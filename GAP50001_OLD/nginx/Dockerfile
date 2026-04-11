# ============================================================
#  Stage 1 — Build React frontend
# ============================================================
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN node node_modules/vite/bin/vite.js build

# ============================================================
#  Stage 2 — Serve with Nginx
# ============================================================
FROM nginx:alpine
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
