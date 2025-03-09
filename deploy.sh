#!/bin/bash
# deploy.sh: Script to deploy the application with sudo rights where needed

# Paths
DEPLOYMENT_CONF="/etc/nginx/conf.d/deployment2.conf"

# Function to get the current deployment
get_current_deployment() {
  sudo grep -oP 'default "\K[^"]+' $DEPLOYMENT_CONF
}

CURRENT_DEPLOYMENT=$(get_current_deployment)
echo "Current deployment is: $CURRENT_DEPLOYMENT"

if [ "$CURRENT_DEPLOYMENT" = "blue" ]; then
  NEW_DEPLOYMENT="green"
  OLD_DEPLOYMENT="blue"
else
  NEW_DEPLOYMENT="blue"
  OLD_DEPLOYMENT="green"
fi

echo "Deploying to: $NEW_DEPLOYMENT"

# Remove old containers in the new deployment environment
echo "Stopping and removing old containers..."
sudo docker-compose stop frontend-$NEW_DEPLOYMENT backend-$NEW_DEPLOYMENT
sudo docker-compose rm -f frontend-$NEW_DEPLOYMENT backend-$NEW_DEPLOYMENT

# Build new images without cache
echo "Building new images without cache..."
sudo docker-compose build frontend-$NEW_DEPLOYMENT backend-$NEW_DEPLOYMENT

# Bring up the new containers
echo "Starting new containers..."
sudo docker-compose up -d frontend-$NEW_DEPLOYMENT backend-$NEW_DEPLOYMENT

# Wait for containers to be ready (optional)
echo "Waiting for containers to start..."
sleep 10

# Update the deployment variable
echo "Updating deployment configuration..."
echo 'map "" $deployment {
    default "'$NEW_DEPLOYMENT'";
}' | sudo tee $DEPLOYMENT_CONF >/dev/null

# Reload Nginx
echo "Reloading Nginx..."
sudo nginx -t && sudo nginx -s reload

echo "Switched deployment to $NEW_DEPLOYMENT"
echo "If issues occur, run './rollback.sh' to revert."
