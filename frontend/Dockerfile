# syntax=docker/dockerfile:1
# Buổi 9: build trong container từ lockfile -> máy dev, CI và máy học viên ra cùng một artifact.
#   docker build --build-arg APP_VERSION=1.0.0 --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) -t care-portal-web:1.0.0 .
#   docker run -p 8090:80 -e API_ORIGIN=http://localhost:8081 -v $PWD/config.json:/usr/share/nginx/html/config.json:ro care-portal-web:1.0.0

# Stage 1: build. Node khớp .nvmrc; engine-strict (.npmrc) chặn nếu lệch.
FROM node:24.22.0-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# Cache thư mục tải của npm giữa các lần build (BuildKit); npm ci vẫn cài đúng theo lockfile.
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
RUN NX_DAEMON=false npx nx build portal --skip-nx-cache

# Stage 2: chỉ file tĩnh + nginx. Image không chứa Node, mã nguồn, node_modules.
FROM nginx:1.31.8-alpine
# Origin của API cho CSP connect-src. Mặc định cho máy học viên; môi trường khác truyền -e API_ORIGIN=...
ENV API_ORIGIN=http://localhost:8081
# Image nginx thay ${API_ORIGIN} trong /etc/nginx/templates/*.template lúc container khởi động.
COPY nginx/ /etc/nginx/templates/
COPY --from=build /app/dist/apps/portal/browser /usr/share/nginx/html
# version.json thuộc artifact (không đổi khi chuyển môi trường); config.json thuộc môi trường (mount lúc chạy).
# ARG đặt sau bước build -> đổi version không build lại Angular.
ARG APP_VERSION=dev
ARG GIT_COMMIT=local
LABEL org.opencontainers.image.version=$APP_VERSION org.opencontainers.image.revision=$GIT_COMMIT
RUN printf '{"version":"%s","commit":"%s"}\n' "$APP_VERSION" "$GIT_COMMIT" > /usr/share/nginx/html/version.json
