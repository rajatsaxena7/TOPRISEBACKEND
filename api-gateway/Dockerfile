FROM node:18

WORKDIR /app

# Copy env files
COPY .env.development .env.development
COPY .env.production .env.production
COPY .env.uat .env.uat

# Copy only what's needed
COPY package package
COPY api-gateway/src src
COPY api-gateway/package.json package.json

# Install dependencies
RUN npm install --production

EXPOSE 3000
CMD ["node", "src/index.js"]