# rollback.sh: Script to rollback the deployment to the previous deployment

# Paths
DEPLOYMENT_CONF="/etc/nginx/conf.d/deployment2.conf"

# Function to get the current deployment
get_current_deployment() {
  grep -oP 'default "\K[^"]+' $DEPLOYMENT_CONF
}

CURRENT_DEPLOYMENT=$(get_current_deployment)
echo "Current deployment is: $CURRENT_DEPLOYMENT"

if [ "$CURRENT_DEPLOYMENT" == "blue" ]; then
  PREVIOUS_DEPLOYMENT="green"
else
  PREVIOUS_DEPLOYMENT="blue"
fi

# Update the deployment variable
echo 'map "" $deployment {
    default "'$PREVIOUS_DEPLOYMENT'";
}' | sudo tee $DEPLOYMENT_CONF

# Reload Nginx
sudo nginx -t && sudo nginx -s reload

echo "Rolled back to $PREVIOUS_DEPLOYMENT"
