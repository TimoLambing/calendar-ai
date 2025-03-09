#!/bin/bash
# calendar-ai/deploy.sh

DEPLOYMENT_CONF="/etc/nginx/conf.d/calendar-deployment.conf"

# Function to get the current deployment
get_current_deployment() {
  sudo grep -oP 'default "\K[^"]+' "$DEPLOYMENT_CONF"
}

CURRENT_DEPLOYMENT=$(get_current_deployment)
echo "Current deployment is: $CURRENT_DEPLOYMENT"

if [ "$CURRENT_DEPLOYMENT" = "blue" ]; then
  NEW_DEPLOYMENT="green"
else
  NEW_DEPLOYMENT="blue"
fi

echo "Deploying to: $NEW_DEPLOYMENT"

# Stop and remove old containers in the new environment
echo "Stopping and removing old containers..."
sudo docker-compose stop frontend-$NEW_DEPLOYMENT backend-$NEW_DEPLOYMENT
sudo docker-compose rm -f frontend-$NEW_DEPLOYMENT backend-$NEW_DEPLOYMENT

# Build new images without cache
echo "Building new images without cache..."
sudo docker-compose build --no-cache frontend-$NEW_DEPLOYMENT backend-$NEW_DEPLOYMENT

# Start the new containers
echo "Starting new containers..."
sudo docker-compose up -d frontend-$NEW_DEPLOYMENT backend-$NEW_DEPLOYMENT

# Optional: Wait for containers to be ready
sleep 10

# Update the deployment variable in the map
echo "Updating deployment configuration..."
echo 'map "" $calendar_deployment {
    default "'$NEW_DEPLOYMENT'";
}' | sudo tee "$DEPLOYMENT_CONF" >/dev/null

# Reload Nginx
echo "Reloading Nginx..."
sudo nginx -t && sudo nginx -s reload

echo "Switched deployment to $NEW_DEPLOYMENT"
echo "If issues occur, revert manually or create a rollback script."
