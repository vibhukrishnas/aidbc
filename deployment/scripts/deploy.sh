#!/bin/bash

# AI Debate Coach Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh production deploy

set -e

# Configuration
ENVIRONMENT=${1:-staging}
ACTION=${2:-deploy}
PROJECT_NAME="debate-coach"
REGISTRY="gcr.io/your-project"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    command -v docker >/dev/null 2>&1 || error "Docker is required but not installed."
    command -v kubectl >/dev/null 2>&1 || error "kubectl is required but not installed."
    
    if [ "$ENVIRONMENT" == "production" ]; then
        command -v helm >/dev/null 2>&1 || error "Helm is required for production deployment."
    fi
    
    log "All prerequisites met!"
}

# Build Docker images
build_images() {
    log "Building Docker images..."
    
    # Build client
    log "Building client image..."
    docker build -t $REGISTRY/$PROJECT_NAME-client:latest \
        -f deployment/docker/Dockerfile.client .
    
    # Build server
    log "Building server image..."
    docker build -t $REGISTRY/$PROJECT_NAME-server:latest \
        -f deployment/docker/Dockerfile.server .
    
    log "Docker images built successfully!"
}

# Push images to registry
push_images() {
    log "Pushing images to registry..."
    
    docker push $REGISTRY/$PROJECT_NAME-client:latest
    docker push $REGISTRY/$PROJECT_NAME-server:latest
    
    log "Images pushed successfully!"
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log "Deploying to Kubernetes ($ENVIRONMENT)..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace $PROJECT_NAME-$ENVIRONMENT --dry-run=client -o yaml | kubectl apply -f -
    
    # Set context
    kubectl config set-context --current --namespace=$PROJECT_NAME-$ENVIRONMENT
    
    # Apply configurations
    kubectl apply -f deployment/kubernetes/deployment.yaml
    kubectl apply -f deployment/kubernetes/service.yaml
    
    # Wait for rollout
    log "Waiting for deployment to complete..."
    kubectl rollout status deployment/debate-coach-client
    kubectl rollout status deployment/debate-coach-server
    
    log "Deployment completed successfully!"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    POD=$(kubectl get pod -l app=debate-coach,component=server -o jsonpath="{.items[0].metadata.name}")
    kubectl exec -it $POD -- npm run migrate
    
    log "Migrations completed!"
}

# Health check
health_check() {
    log "Running health checks..."
    
    # Get service URL
    if [ "$ENVIRONMENT" == "production" ]; then
        URL="https://debate-coach.com"
    else
        URL=$(kubectl get service debate-coach-client -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    fi
    
    # Check health endpoint
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $URL/api/health)
    
    if [ $HTTP_CODE -eq 200 ]; then
        log "Health check passed!"
    else
        error "Health check failed with status code: $HTTP_CODE"
    fi
}

# Rollback deployment
rollback() {
    log "Rolling back deployment..."
    
    kubectl rollout undo deployment/debate-coach-client
    kubectl rollout undo deployment/debate-coach-server
    
    log "Rollback completed!"
}

# Main execution
main() {
    log "Starting deployment process for $ENVIRONMENT environment..."
    
    check_prerequisites
    
    case $ACTION in
        deploy)
            build_images
            push_images
            deploy_kubernetes
            run_migrations
            health_check
            ;;
        build)
            build_images
            ;;
        push)
            push_images
            ;;
        rollback)
            rollback
            ;;
        health)
            health_check
            ;;
        *)
            error "Unknown action: $ACTION"
            ;;
    esac
    
    log "Process completed successfully!"
}

# Run main function
main