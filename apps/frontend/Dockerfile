FROM node:22-alpine AS builder
WORKDIR /app
ARG VITE_AWS_REGION
ARG VITE_COGNITO_CLIENT_ID
ARG VITE_COGNITO_USER_POOL_ID
ENV VITE_AWS_REGION=$VITE_AWS_REGION
ENV VITE_COGNITO_CLIENT_ID=$VITE_COGNITO_CLIENT_ID
ENV VITE_COGNITO_USER_POOL_ID=$VITE_COGNITO_USER_POOL_ID
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
