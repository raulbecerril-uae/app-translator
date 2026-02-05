const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const SpeechToTextService = require('./services/speechToText');
const TranslationService = require('./services/translation');

class RealTimeTranslationServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        this.clients = new Map();
        
        this.speechService = new SpeechToTextService();
        this.translationService = new TranslationService();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }
    
    setupMiddleware() {
        // CORS configuration
        this.app.use(cors({
            origin: [
                'http://localhost:3000', 
                'http://127.0.0.1:3000', 
                'http://localhost:8080',
                'http://127.0.0.1:8080',
                'http://localhost:5501',
                'http://127.0.0.1:5501',
                'http://localhost:5500',
                'http://127.0.0.1:5500',
                'http://localhost',
                'http://127.0.0.1',
                'file://',
                '*'
            ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));
        
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../frontend')));
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                clients: this.clients.size
            });
        });
        
        // Get supported languages
        this.app.get('/api/languages', (req, res) => {
            res.json(this.translationService.getSupportedLanguages());
        });
        
        // Get translation statistics
        this.app.get('/api/stats', (req, res) => {
            res.json({
                translation: this.translationService.getTranslationStats(),
                server: {
                    uptime: process.uptime(),
                    connectedClients: this.clients.size,
                    memoryUsage: process.memoryUsage(),
                    nodeVersion: process.version
                }
            });
        });
        
        // Clear translation cache
        this.app.post('/api/cache/clear', (req, res) => {
            this.translationService.clearCache();
            res.json({ message: 'Translation cache cleared successfully' });
        });
        
        // Text-only translation endpoint
        this.app.post('/api/translate', async (req, res) => {
            try {
                const { text, sourceLang, targetLang } = req.body;
                
                if (!text || !sourceLang || !targetLang) {
                    return res.status(400).json({ 
                        error: 'Missing required fields: text, sourceLang, targetLang' 
                    });
                }
                
                const translation = await this.translationService.translate(text, sourceLang, targetLang);
                
                res.json({
                    originalText: text,
                    translatedText: translation,
                    sourceLang,
                    targetLang,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error('Translation error:', error);
                res.status(500).json({ error: 'Translation failed', details: error.message });
            }
        });
        
        // Serve frontend
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../frontend/index.html'));
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ 
            noServer: true,
            perMessageDeflate: false 
        });
        
        this.wss.on('connection', (ws, request) => {
            const clientId = uuidv4();
            const clientInfo = {
                id: clientId,
                ws: ws,
                isRecording: false,
                audioBuffer: Buffer.alloc(0),
                config: {
                    sourceLang: 'en',
                    targetLang: 'ar',
                    sampleRate: 16000
                }
            };
            
            this.clients.set(clientId, clientInfo);
            console.log(`Client connected: ${clientId} (Total: ${this.clients.size})`);
            
            // Send connection confirmation
            ws.send(JSON.stringify({
                type: 'connection',
                status: 'connected',
                clientId: clientId,
                message: 'Connected to real-time translation server'
            }));
            
            ws.on('message', async (data) => {
                try {
                    await this.handleWebSocketMessage(clientId, data);
                } catch (error) {
                    console.error(`Error handling message from ${clientId}:`, error);
                    this.sendError(clientId, 'Message processing failed', error.message);
                }
            });
            
            ws.on('close', () => {
                console.log(`Client disconnected: ${clientId}`);
                this.clients.delete(clientId);
            });
            
            ws.on('error', (error) => {
                console.error(`WebSocket error for ${clientId}:`, error);
                this.clients.delete(clientId);
            });
        });
    }
    
    async handleWebSocketMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        try {
            // Check if it's JSON (control message) or binary (audio data)
            if (data[0] === 0x7B) { // JSON starts with '{'
                const message = JSON.parse(data.toString());
                await this.handleControlMessage(clientId, message);
            } else {
                // Handle binary audio data
                await this.handleAudioData(clientId, data);
            }
        } catch (error) {
            console.error('Message handling error:', error);
            this.sendError(clientId, 'Invalid message format', error.message);
        }
    }
    
    async handleControlMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        console.log(`Control message from ${clientId}:`, message.type);
        
        switch (message.type) {
            case 'config':
                client.config = { ...client.config, ...message.data };
                this.sendResponse(clientId, 'config', { 
                    status: 'updated', 
                    config: client.config 
                });
                break;
                
            case 'start_recording':
                client.isRecording = true;
                client.audioBuffer = Buffer.alloc(0);
                this.sendResponse(clientId, 'recording', { 
                    status: 'started',
                    message: 'Recording started - speak now!'
                });
                break;
                
            case 'stop_recording':
                client.isRecording = false;
                if (client.audioBuffer.length > 0) {
                    await this.processAudioBuffer(clientId);
                }
                this.sendResponse(clientId, 'recording', { 
                    status: 'stopped',
                    message: 'Recording stopped - processing audio...'
                });
                break;
                
            case 'translate_text':
                if (message.text) {
                    await this.translateText(clientId, message.text);
                }
                break;
                
            case 'ping':
                this.sendResponse(clientId, 'pong', { timestamp: new Date().toISOString() });
                break;
                
            default:
                this.sendError(clientId, 'Unknown message type', message.type);
        }
    }
    
    async handleAudioData(clientId, audioData) {
        const client = this.clients.get(clientId);
        if (!client || !client.isRecording) return;
        
        // Accumulate audio data
        client.audioBuffer = Buffer.concat([client.audioBuffer, audioData]);
        
        // Process in chunks for real-time transcription
        if (client.audioBuffer.length >= 32000) { // ~2 seconds at 16kHz
            await this.processAudioChunk(clientId);
        }
    }
    
    async processAudioChunk(clientId) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        try {
            // Process the current buffer
            const audioData = client.audioBuffer;
            client.audioBuffer = Buffer.alloc(0); // Reset buffer
            
            // Convert audio to text
            const transcript = await this.speechService.transcribe(audioData, {
                sampleRate: client.config.sampleRate,
                language: client.config.sourceLang
            });
            
            if (transcript && transcript.trim()) {
                console.log(`Transcript for ${clientId}:`, transcript);
                
                // Send transcript immediately
                this.sendResponse(clientId, 'transcript', {
                    text: transcript,
                    language: client.config.sourceLang,
                    timestamp: new Date().toISOString()
                });
                
                // Translate and send
                await this.translateText(clientId, transcript);
            }
            
        } catch (error) {
            console.error('Audio processing error:', error);
            this.sendError(clientId, 'Audio processing failed', error.message);
        }
    }
    
    async processAudioBuffer(clientId) {
        const client = this.clients.get(clientId);
        if (!client || client.audioBuffer.length === 0) return;
        
        try {
            const transcript = await this.speechService.transcribe(client.audioBuffer, {
                sampleRate: client.config.sampleRate,
                language: client.config.sourceLang
            });
            
            if (transcript && transcript.trim()) {
                this.sendResponse(clientId, 'final_transcript', {
                    text: transcript,
                    language: client.config.sourceLang,
                    timestamp: new Date().toISOString()
                });
                
                await this.translateText(clientId, transcript);
            }
            
            client.audioBuffer = Buffer.alloc(0);
            
        } catch (error) {
            console.error('Final audio processing error:', error);
            this.sendError(clientId, 'Final audio processing failed', error.message);
        }
    }
    
    async translateText(clientId, text) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        try {
            const translation = await this.translationService.translate(
                text, 
                client.config.sourceLang, 
                client.config.targetLang
            );
            
            this.sendResponse(clientId, 'translation', {
                originalText: text,
                translatedText: translation,
                sourceLang: client.config.sourceLang,
                targetLang: client.config.targetLang,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Translation error:', error);
            this.sendError(clientId, 'Translation failed', error.message);
        }
    }
    
    sendResponse(clientId, type, data) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ type, data }));
        }
    }
    
    sendError(clientId, message, details = null) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ 
                type: 'error', 
                data: { message, details, timestamp: new Date().toISOString() }
            }));
        }
    }
    
    start(port = 8080) {
        this.server = this.app.listen(port, () => {
            console.log(`🚀 Real-time Translation Server running on port ${port}`);
            console.log(`📡 WebSocket server ready for connections`);
            console.log(`🌐 Frontend available at http://localhost:${port}`);
        });
        
        // Handle WebSocket upgrade
        this.server.on('upgrade', (request, socket, head) => {
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.wss.emit('connection', ws, request);
            });
        });
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down server...');
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.close();
                }
            });
            this.server.close(() => {
                console.log('✅ Server shut down gracefully');
                process.exit(0);
            });
        });
    }
}

// Start the server
const server = new RealTimeTranslationServer();
server.start(process.env.PORT || 8080);
