# ---- build ----------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
# Public (non-secret) Entra/SPA config is baked in at build time.
ARG VITE_ENTRA_CLIENT_ID
ARG VITE_ENTRA_TENANT_ID
ARG VITE_API_SCOPE
ARG VITE_API_BASE=/api
ARG VITE_ALLOW_DEMO_AUTH=true
ENV VITE_ENTRA_CLIENT_ID=$VITE_ENTRA_CLIENT_ID \
    VITE_ENTRA_TENANT_ID=$VITE_ENTRA_TENANT_ID \
    VITE_API_SCOPE=$VITE_API_SCOPE \
    VITE_API_BASE=$VITE_API_BASE \
    VITE_ALLOW_DEMO_AUTH=$VITE_ALLOW_DEMO_AUTH
RUN npm run build

# ---- runtime --------------------------------------------------------------
FROM nginx:1.31-alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
