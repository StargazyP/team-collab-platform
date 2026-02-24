#!/bin/bash

echo "Starting WebSocket dev server on port 8081..."

export NODE_ENV=development
export PORT=8081

cd /home/jangdonggun/포트폴리오/nextjs/user

npm run ws:dev
