# Start your image with a node base image
FROM node:14

# The /app directory should act as the main application directory
WORKDIR /app

# Copy the app package and package-lock.json file
COPY package*.json ./

# Install node packages
RUN npm install

# Copy local directories to the current local directory of our docker image (/app)
COPY ./views ./views
COPY ./public ./public
COPY server.js .

EXPOSE 3030

# Start the app using serve command
CMD ["npm", "start"]