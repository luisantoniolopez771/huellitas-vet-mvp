FROM node:22-bookworm-slim

WORKDIR /app/backend

COPY backend/package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --chown=node:node backend/server.js ./
COPY --chown=node:node frontend/ /app/frontend/

USER node

EXPOSE 3000

CMD ["npm", "start"]