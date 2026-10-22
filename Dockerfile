FROM nginx:1.30.6-alpine-slim
COPY nginx.conf /etc/nginx/nginx.conf
COPY public/ /usr/share/nginx/html/
COPY --chmod=755 scripts/container-start.sh /usr/local/bin/container-start
USER nginx
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:80/ || exit 1
ENTRYPOINT ["/usr/local/bin/container-start"]
CMD ["nginx", "-g", "daemon off;"]
