# Bản đầu tiên (buổi 9): build portal trên máy rồi chép dist vào nginx.
#   npx nx build portal
#   docker build -t care-portal-web:dev .
FROM nginx:alpine
COPY dist/apps/portal/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
