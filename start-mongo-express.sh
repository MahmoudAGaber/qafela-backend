#!/bin/bash
# Start mongo-express web interface

# Set MongoDB connection (from .env or default)
if [ -f .env ]; then
  source .env
  MONGO_URL=${MONGO_URL:-"mongodb://localhost:27017"}
  MONGO_DB=${MONGO_DB:-"qafela_dev"}
else
  MONGO_URL="mongodb://127.0.0.1:27017"
  MONGO_DB="qafela"
fi

echo "Starting mongo-express..."
echo "MongoDB URL: $MONGO_URL"
echo "Database: $MONGO_DB"
echo ""
echo "Access mongo-express at: http://localhost:8081"
echo "Press Ctrl+C to stop"
echo ""

export ME_CONFIG_MONGODB_URL=$MONGO_URL
export ME_CONFIG_MONGODB_SERVER=localhost
export ME_CONFIG_BASICAUTH_USERNAME=admin
export ME_CONFIG_BASICAUTH_PASSWORD=pass
export ME_CONFIG_MONGODB_ENABLE_ADMIN=true

# Use local installation
if [ -d "node_modules/mongo-express" ]; then
  node node_modules/mongo-express/app.js
else
  echo "mongo-express not found. Installing..."
  npm install --save-dev mongo-express
  node node_modules/mongo-express/app.js
fi
