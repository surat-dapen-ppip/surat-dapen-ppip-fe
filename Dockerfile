# === Dockerfile (runtime only) ===
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy hasil build dari GitHub Actions
COPY .next ./.next
COPY public ./public
COPY package.json ./
COPY next.config.mjs ./

# Install dependencies production only
RUN npm ci --omit=dev

EXPOSE 3000
CMD ["npm", "start"]
