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
WORKDIR /appname: CI/CD Deploy Frontend

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v3

      - name: Setup SSH Agent
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Copy ENV file to VPS
        env:
          ENV_FILE: ${{ secrets.ENV_FILE }}
        run: |
          # write secret ENV_FILE to .env
          echo "$ENV_FILE" > .env
          # copy .env to the VPS project directory (adjust path on server if needed)
          scp -o StrictHostKeyChecking=no .env ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_IP }}:/home/doaibub25/surat-dapen-ppip-fe/.env

      - name: Deploy to VPS via SSH
        run: |
          ssh -o StrictHostKeyChecking=no ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_IP }} << 'EOF'
            PROJECT_DIR=/home/doaibub25/surat-dapen-ppip-fe

            # clone if missing
            if [ ! -d "$PROJECT_DIR/.git" ]; then
              git clone git@github.com:surat-dapen-ppip/surat-dapen-ppip-fe.git $PROJECT_DIR
            fi

            cd $PROJECT_DIR

            # fetch & reset to main
            git fetch origin main
            git reset --hard origin/main

            # build docker image
            docker build -t surat-dapen-ppip-fe:latest .

            # stop old container & run new one
            docker rm -f surat-dapen-ppip-fe || true
            docker run -d --name surat-dapen-ppip-fe --env-file .env -p 3000:3000 surat-dapen-ppip-fe:latest
          EOF

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
