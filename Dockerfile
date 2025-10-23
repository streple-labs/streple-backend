# ====================================
# Development Stage (for local/grafana)
# ====================================
FROM node:22.15.0 AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build
# Development entry point (adjust as needed)
# CMD ["npm", "run", "start:dev"]


# ===================
# Production Stage
# ===================
FROM node:22.15.0 AS production


ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev
RUN npm install -g npm@11 && npm install

COPY . .

COPY --from=development /app/dist ./dist
# Optional: Build step for TypeScript etc.
# RUN npm run build

CMD ["npm", "run", "start:prod"]
