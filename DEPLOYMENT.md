# 🚀 Deployment Guide

This guide covers various deployment options for the Real-Time Speech Translation System.

## 📋 Prerequisites

- **Node.js** 16+ installed
- **Git** for version control
- **Domain name** (for production)
- **SSL certificate** (for HTTPS/WSS)
- **API keys** for translation services (optional)

## 🏠 Local Development

### Quick Start
```bash
# Clone repository
git clone https://github.com/raulbecerril-uae/app-translator.git
cd app-translator/translator/speech-translation-app/backend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

## 🌐 Production Deployment

### 1. VPS/Cloud Server Deployment

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y
```

#### Step 2: Application Setup
```bash
# Clone repository
git clone https://github.com/raulbecerril-uae/app-translator.git
cd app-translator/translator/speech-translation-app/backend

# Install production dependencies
npm ci --only=production

# Create environment file
cp .env.example .env
nano .env
```

#### Step 3: PM2 Configuration
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'speech-translator',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 8080
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

#### Step 4: Nginx Configuration
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/speech-translator << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/speech-translator /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 2. Docker Deployment

#### Dockerfile
```dockerfile
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY translator/speech-translation-app/backend/package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY translator/speech-translation-app/backend/ ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create temp directory
RUN mkdir -p temp && chown nodejs:nodejs temp

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  speech-translator:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - speech-translator
    restart: unless-stopped
```

#### Build and Deploy
```bash
# Build image
docker build -t speech-translator .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f speech-translator
```

### 3. Cloud Platform Deployment

#### Heroku
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set NPM_CONFIG_PRODUCTION=false

# Create Procfile
echo "web: cd translator/speech-translation-app/backend && npm start" > Procfile

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

#### AWS EC2
```bash
# Launch EC2 instance (Ubuntu 20.04 LTS)
# Configure security groups (ports 22, 80, 443, 8080)
# Follow VPS deployment steps above
# Configure Elastic Load Balancer for high availability
# Setup Auto Scaling Group for scalability
```

#### DigitalOcean Droplet
```bash
# Create droplet (Ubuntu 20.04)
# Follow VPS deployment steps
# Configure firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

## 🔧 Environment Configuration

### Production Environment Variables
```bash
# Server Configuration
NODE_ENV=production
PORT=8080
LOG_LEVEL=info

# Translation API Keys (optional)
MICROSOFT_TRANSLATOR_KEY=your_key_here
GOOGLE_TRANSLATE_KEY=your_key_here

# Security
SESSION_SECRET=your_random_secret_here
CORS_ORIGIN=https://your-domain.com

# Performance
MAX_CONNECTIONS=100
CACHE_SIZE=1000
REQUEST_TIMEOUT=8000
```

### SSL/TLS Setup

#### Let's Encrypt (Free SSL)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Custom SSL Certificate
```bash
# Place certificate files
sudo mkdir -p /etc/ssl/certs
sudo cp your-certificate.crt /etc/ssl/certs/
sudo cp your-private.key /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/your-private.key
```

## 📊 Monitoring & Maintenance

### PM2 Monitoring
```bash
# View status
pm2 status

# View logs
pm2 logs speech-translator

# Restart application
pm2 restart speech-translator

# Monitor resources
pm2 monit
```

### System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Check system resources
htop
df -h
free -h

# Monitor network
sudo nethogs
sudo ss -tulpn
```

### Log Management
```bash
# Rotate logs
sudo tee /etc/logrotate.d/speech-translator << EOF
/path/to/app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

## 🔒 Security Hardening

### Firewall Configuration
```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Fail2Ban Setup
```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure for Nginx
sudo tee /etc/fail2ban/jail.local << EOF
[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
EOF

sudo systemctl restart fail2ban
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
sudo lsof -i :8080
sudo netstat -tulpn | grep :8080

# Kill process
sudo kill -9 <PID>
```

#### Permission Errors
```bash
# Fix file permissions
sudo chown -R nodejs:nodejs /path/to/app
sudo chmod -R 755 /path/to/app
```

#### Memory Issues
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### SSL Certificate Issues
```bash
# Test SSL configuration
sudo nginx -t
openssl s_client -connect your-domain.com:443

# Renew Let's Encrypt certificate
sudo certbot renew --dry-run
```

## 📈 Performance Optimization

### Node.js Optimization
```bash
# Increase memory limit
node --max-old-space-size=4096 server.js

# Enable cluster mode
pm2 start server.js -i max
```

### Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 📞 Support

For deployment issues:
- 📧 Email: raulbecerril.uae@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/raulbecerril-uae/app-translator/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/raulbecerril-uae/app-translator/discussions)

---

**Happy Deploying! 🚀**