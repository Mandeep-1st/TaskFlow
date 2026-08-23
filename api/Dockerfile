FROM node:22-alpine

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN DATABASE_URL=postgresql://postgres:postgres@postgres:5432/taskflow pnpm prisma generate && pnpm build

EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]
