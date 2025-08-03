#FROM 658919911873.dkr.ecr.us-east-1.amazonaws.com/backend:latest
FROM node:14-alpine

# Create app directory
WORKDIR /app

ENV PORT=3000

# RUN apk add --no-cache python3 make g++

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package.json ./

RUN npm install --force --frozen-lockfile
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# RUN chmod 777 /app/src/watermarker/media/camera
# RUN chmod 777 /app/public


EXPOSE $PORT
ENTRYPOINT ["npm", "start"]