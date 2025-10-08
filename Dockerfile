# 🧩 Runtime-only image (no build, already prebuilt in CI/CD)
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
USER nextjs

# Copy prebuilt files from CI/CD (will come via tar in deploy.yml)
COPY . .

EXPOSE 3000
CMD ["npm", "run", "start"]
