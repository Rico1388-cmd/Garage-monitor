FROM mcr.microsoft.com/playwright:v1.62.1-noble

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY src ./src

RUN mkdir -p /data && chown -R pwuser:pwuser /app /data
USER pwuser

ENV NODE_ENV=production
CMD ["node", "src/index.mjs"]
