# Use exact Node version
FROM node:22.15.0

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app
COPY . .

# Build if needed
# RUN npm run build

# Start your app
CMD ["npm", "start"]
