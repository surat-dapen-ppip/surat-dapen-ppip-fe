### Production Dockerfile for Next.js 14
## Multi-stage build: install deps, build, and run minimal runtime

FROM node:20-alpine AS base
WORKDIR /app

# copy package files first to install deps
COPY package.json package-lock.json* ./

# install dependencies (use npm ci if package-lock.json present)
RUN if [ -f package-lock.json ]; then npm ci --production=false; else npm install; fi

# copy rest of the source
COPY . .

# build the app
RUN npm run build

# production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# copy built files and production deps
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/next.config.mjs ./

# expose default Next.js port
EXPOSE 3000

# default start
CMD ["npm", "run", "start"]
