# Use exact Node version
FROM node:23

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Upgrade to NPM 11 and install dependencies
RUN npm install -g npm@11 && npm install

# Copy the rest of the app
COPY . .

# Optional: Build step if you're using TypeScript or need to build assets
# RUN npm run build

# Start your app
CMD ["npm", "start"]

