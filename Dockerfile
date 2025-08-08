FROM 644951122123.dkr.ecr.ap-south-1.amazonaws.com/aws-ecs-app:baseimage

# Set working directory
WORKDIR /app

# Create directory for certificates
RUN mkdir -p /app/certs

# Copy RDS SSL certificate
COPY certs/rds-ca-2019-root.pem /app/certs/

# Copy package files and install only production deps
COPY backend/package*.json ./
RUN npm install --production

# Copy backend code
COPY backend/ ./

# Copy Nginx config
COPY nginx/default.conf /etc/nginx/sites-available/default

# Copy Supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port
EXPOSE 80

# Run supervisor
CMD ["/usr/bin/supervisord"]