# 🗣️ Real-Time Speech Translation System

A complete, production-ready real-time speech-to-text translation system with WebSocket streaming, modern web interface, and multiple fallback options.

## ✨ Features

### 🎤 **Advanced Speech Recognition**
- **Web Audio API** for high-quality real-time audio streaming
- **Web Speech API** fallback for maximum compatibility  
- **Audio visualization** with live frequency analysis
- **Configurable audio quality** (16kHz, 44.1kHz, 48kHz)
- **Real-time streaming** to server via WebSocket

### 🌍 **Multi-Language Translation**
- **Opus-MT integration** (when available)
- **Offline dictionary** fallback with 40+ common phrases
- **Multiple language pairs** (English ↔ Arabic, Spanish, French, German)
- **Auto-translation** as you speak
- **Translation confidence scoring**

### 💻 **Modern Web Interface**
- **Glassmorphism design** with beautiful animations
- **Responsive layout** for desktop and mobile
- **Real-time audio visualization** 
- **Translation history** with export functionality
- **Keyboard shortcuts** for power users
- **Settings panel** with customization options

### 🔧 **Technical Excellence**
- **WebSocket real-time communication**
- **Automatic reconnection** with exponential backoff
- **Error handling** and graceful degradation
- **Performance optimization** for real-time processing
- **Cross-browser compatibility**
- **Production-ready architecture**

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ 
- **npm** or **yarn**
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **Microphone access** for speech input

### 1. Install Dependencies

```bash
# Navigate to backend directory
cd speech-translation-app/backend

# Install server dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### 2. Start the Server

```bash
# Start the real-time translation server
npm start

# For development with auto-reload
npm run dev
```

### 3. Open the Application

```
🌐 Frontend: http://localhost:8080
📡 WebSocket: ws://localhost:8080
🔧 Health Check: http://localhost:8080/api/health
```

## 📁 Project Structure

```
speech-translation-app/
├── 📁 frontend/
│   ├── 📄 index.html              # Main application UI
│   ├── 📁 css/
│   │   └── 📄 style.css           # Complete styling with animations
│   ├── 📁 js/
│   │   ├── 📄 app.js              # Main application logic
│   │   ├── 📄 websocketClient.js  # WebSocket communication
│   │   └── 📄 audioProcessor.js   # Audio capture & processing
│   └── 📁 assets/
├── 📁 backend/
│   ├── 📄 server.js               # Express + WebSocket server
│   ├── 📄 package.json            # Dependencies & scripts
│   ├── 📄 .env.example            # Configuration template
│   ├── 📁 services/
│   │   ├── 📄 speechToText.js     # STT processing
│   │   └── 📄 translation.js     # Translation engine
│   └── 📁 utils/
└── 📄 README.md                   # This file
```

## 🔧 Configuration

### Audio Settings
```javascript
// Configurable in settings panel
sampleRate: 16000,     // 16kHz, 44.1kHz, or 48kHz
channels: 1,           // Mono audio
bufferSize: 4096,      // Audio buffer size
```

### Language Support
```javascript
// Currently supported languages
'en': 'English'   🇺🇸
'ar': 'Arabic'    🇸🇦  
'es': 'Spanish'   🇪🇸
'fr': 'French'    🇫🇷
'de': 'German'    🇩🇪
```

### WebSocket Configuration
```javascript
// Real-time communication settings
reconnectAttempts: 5,
reconnectDelay: 1000,
heartbeatInterval: 30000,
maxConnections: 100
```

## 🎯 Usage Guide

### 🎤 **Voice Translation**
1. **Select Languages**: Choose source and target languages
2. **Click "Start Recording"**: Begin voice input  
3. **Speak Clearly**: Say your text naturally
4. **Auto-Translation**: Watch real-time translation appear
5. **Stop Recording**: Click stop when finished

### ⌨️ **Text Translation**  
1. **Type or Paste**: Enter text in the input area
2. **Auto-Translate**: Translation appears automatically
3. **Manual Translate**: Click translate button if needed

### 📱 **Mobile Usage**
- **Responsive design** works perfectly on mobile
- **Touch-friendly** controls and interface
- **Voice input** fully supported on mobile browsers

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+R` | Start/Stop Recording |
| `Ctrl+T` | Translate Current Text |
| `Ctrl+L` | Clear All Text |
| `Ctrl+,` | Open Settings |
| `Esc` | Close Settings |

## 🔌 API Reference

### WebSocket Messages

**Client → Server:**
```javascript
// Start recording
{ type: 'start_recording' }

// Stop recording  
{ type: 'stop_recording' }

// Update configuration
{ type: 'config', data: { sourceLang: 'en', targetLang: 'ar' } }

// Translate text
{ type: 'translate_text', text: 'Hello world' }
```

**Server → Client:**
```javascript
// Real-time transcript
{ type: 'transcript', data: { text: 'Hello', language: 'en' } }

// Final translation
{ type: 'translation', data: { 
    originalText: 'Hello', 
    translatedText: 'مرحبا',
    sourceLang: 'en',
    targetLang: 'ar' 
}}

// Error message
{ type: 'error', data: { message: 'Error details' } }
```

### REST API Endpoints

```bash
# Health check
GET /api/health

# Get supported languages
GET /api/languages  

# Text-only translation
POST /api/translate
{
  "text": "Hello world",
  "sourceLang": "en", 
  "targetLang": "ar"
}
```

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Run in production mode
npm start
```

### Environment Variables
```bash
# Copy and customize
cp .env.example .env

# Key settings
PORT=8080
SAMPLE_RATE=16000
LOG_LEVEL=info
```

### Adding New Languages
1. **Update translation service**: Add language to `supportedLanguages`
2. **Add dictionary entries**: Extend `translationDictionary` 
3. **Update frontend**: Add language options to select elements
4. **Test thoroughly**: Verify speech recognition works

## 🐛 Troubleshooting

### Common Issues

**🎤 Microphone Not Working**
- ✅ Check browser permissions
- ✅ Ensure HTTPS (required for microphone access)
- ✅ Try refreshing the page
- ✅ Check system microphone settings

**🔌 Connection Issues**
- ✅ Verify server is running on port 8080
- ✅ Check firewall settings
- ✅ Ensure WebSocket is not blocked
- ✅ Try different browser

**🗣️ Speech Recognition Problems**
- ✅ Speak clearly and slowly
- ✅ Check language selection
- ✅ Ensure quiet environment
- ✅ Try Chrome for best compatibility

**🌍 Translation Not Working**
- ✅ Check internet connection
- ✅ Verify language pair is supported
- ✅ Server logs for error details
- ✅ Fallback to text input

### Debug Mode
```bash
# Enable detailed logging
LOG_LEVEL=debug npm start

# Check WebSocket connection
# Open browser console and look for connection logs
```

## 🚀 Deployment

### Production Deployment
```bash
# Set production environment
NODE_ENV=production

# Install only production dependencies  
npm ci --only=production

# Start with PM2 (recommended)
pm2 start server.js --name "translation-server"

# Or use Docker
docker build -t speech-translator .
docker run -p 8080:8080 speech-translator
```

### Docker Setup
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

### Nginx Configuration
```nginx
upstream translation_backend {
    server localhost:8080;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://translation_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`  
5. **Open Pull Request**

### Development Guidelines
- ✅ Follow existing code style
- ✅ Add comprehensive comments
- ✅ Test thoroughly across browsers
- ✅ Update documentation
- ✅ Include error handling

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Web Speech API** for browser speech recognition
- **Opus-MT** for open-source neural machine translation
- **WebSocket** for real-time communication
- **Font Awesome** for beautiful icons
- **Inter Font** for clean typography

## 📞 Support

- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Start a discussion
- 📧 **Email Support**: support@yourdomain.com
- 💬 **Community Chat**: Join our Discord

---

**Built with ❤️ for real-time communication across language barriers**

🌟 **Star this repo if it helped you!** 🌟
