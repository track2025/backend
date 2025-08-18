#FROM 111033343083.dkr.ecr.us-east-1.amazonaws.com/lapsnaps/frontend:latest
FROM node:22


# Create app directory
WORKDIR /app

ENV PORT=3000

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# RUN npm install --legacy-peer-deps 
RUN npm ci --omit=dev

# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# RUN chmod 777 /app/src/watermarker/media/camera
# RUN chmod 777 /app/public


EXPOSE $PORT
ENTRYPOINT ["npm", "start"]