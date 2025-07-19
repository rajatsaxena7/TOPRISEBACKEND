FROM node:18-alpine

WORKDIR /app

# Copy app source
COPY . .

# Install dependencies
RUN npm install

# Expose port (change if needed)
EXPOSE 3000

# Run your app
CMD ["node", "src/index.js"]
