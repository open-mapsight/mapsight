FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json ./
COPY dist ./dist

USER node

ENV HOME=/tmp
ENV MAPSIGHT_SSR_HOST=0.0.0.0
ENV MAPSIGHT_SSR_PORT=4123
ENV MAPSIGHT_SSR_MODULE=/app/dist/render.js

EXPOSE 4123

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
	CMD ["node", "-e", "fetch('http://127.0.0.1:4123/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "dist/server.js"]
