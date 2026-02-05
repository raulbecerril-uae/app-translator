class WebSocketClient {
    constructor() {
        this.ws = null;
        this.clientId = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.messageHandlers = new Map();
        this.connectionHandlers = [];
        
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        // Default message handlers
        this.onMessage('connection', (message) => {
            // Handle both formats: {type, data} and direct properties
            const clientId = message.clientId || (message.data && message.data.clientId);
            if (clientId) {
                this.clientId = clientId;
                console.log('Connected with client ID:', this.clientId);
            }
            const status = message.status || (message.data && message.data.status);
            const msg = message.message || (message.data && message.data.message);
            console.log('Connection status:', status, msg);
        });
        
        this.onMessage('error', (message) => {
            console.error('Server error:', message);
            // Handle both formats
            const errorMsg = message.message || (message.data && message.data.message) || 'Unknown error';
            const details = message.details || (message.data && message.data.details);
            this.notifyError(errorMsg, details);
        });
        
        this.onMessage('pong', (message) => {
            const timestamp = message.timestamp || (message.data && message.data.timestamp);
            console.log('Pong received:', timestamp);
        });
    }
    
    connect(url = 'ws://localhost:8080') {
        return new Promise((resolve, reject) => {
            try {
                console.log('Connecting to WebSocket server:', url);
                this.ws = new WebSocket(url);
                
                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.updateConnectionStatus('connected');
                    this.notifyConnectionHandlers('connected');
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    try {
                        // Check if the message is JSON
                        let message;
                        if (typeof event.data === 'string') {
                            message = JSON.parse(event.data);
                        } else {
                            console.warn('Received non-string message:', event.data);
                            return;
                        }
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error, 'Raw data:', event.data);
                        this.notifyError('Message Parse Error', 'Invalid message format: ' + error.message);
                    }
                };
                
                this.ws.onclose = (event) => {
                    console.log('WebSocket closed:', event.code, event.reason);
                    this.isConnected = false;
                    this.updateConnectionStatus('disconnected');
                    this.notifyConnectionHandlers('disconnected');
                    
                    // Attempt to reconnect if not a clean close
                    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.attemptReconnect();
                    }
                };
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.updateConnectionStatus('error');
                    this.notifyConnectionHandlers('error');
                    reject(error);
                };
                
            } catch (error) {
                console.error('Failed to create WebSocket connection:', error);
                reject(error);
            }
        });
    }
    
    attemptReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
        this.updateConnectionStatus('connecting');
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect().catch(error => {
                    console.error('Reconnection failed:', error);
                    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                        this.notifyError('Connection failed', 'Unable to reconnect to server. Please refresh the page.');
                    }
                });
            }
        }, delay);
    }
    
    disconnect() {
        if (this.ws) {
            console.log('Disconnecting WebSocket');
            this.ws.close(1000, 'Client disconnecting');
            this.ws = null;
            this.isConnected = false;
            this.clientId = null;
            this.updateConnectionStatus('disconnected');
        }
    }
    
    sendMessage(type, data = {}) {
        if (!this.isConnected || !this.ws) {
            console.warn('Cannot send message: not connected');
            this.notifyError('Connection Error', 'Not connected to server');
            return false;
        }
        
        try {
            const message = JSON.stringify({ type, ...data });
            this.ws.send(message);
            console.log('Sent message:', type, data);
            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            this.notifyError('Send Error', 'Failed to send message to server');
            return false;
        }
    }
    
    sendAudioData(audioBuffer) {
        if (!this.isConnected || !this.ws) {
            console.warn('Cannot send audio: not connected');
            return false;
        }
        
        try {
            this.ws.send(audioBuffer);
            return true;
        } catch (error) {
            console.error('Failed to send audio data:', error);
            this.notifyError('Audio Error', 'Failed to send audio data');
            return false;
        }
    }
    
    handleMessage(message) {
        // Support both message formats:
        // Format 1: {type, data} - data contains the actual message content
        // Format 2: {type, ...properties} - properties are at the top level
        
        const { type } = message;
        let messageData;
        
        if (message.data !== undefined) {
            // Format 1: {type, data}
            messageData = message.data;
        } else {
            // Format 2: {type, ...properties} - extract everything except type
            messageData = { ...message };
            delete messageData.type;
        }
        
        const handler = this.messageHandlers.get(type);
        if (handler) {
            try {
                handler(messageData);
            } catch (error) {
                console.error(`Error handling message type ${type}:`, error);
            }
        } else {
            console.warn('No handler for message type:', type, 'Available handlers:', Array.from(this.messageHandlers.keys()));
        }
    }
    
    onMessage(type, handler) {
        this.messageHandlers.set(type, handler);
    }
    
    onConnection(handler) {
        this.connectionHandlers.push(handler);
    }
    
    notifyConnectionHandlers(status) {
        this.connectionHandlers.forEach(handler => {
            try {
                handler(status);
            } catch (error) {
                console.error('Error in connection handler:', error);
            }
        });
    }
    
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;
        
        const icon = statusElement.querySelector('i');
        const text = statusElement.querySelector('span');
        
        statusElement.className = 'connection-status ' + status;
        
        switch (status) {
            case 'connected':
                if (text) text.textContent = 'Connected';
                break;
            case 'connecting':
                if (text) text.textContent = 'Connecting...';
                break;
            case 'disconnected':
                if (text) text.textContent = 'Disconnected';
                break;
            case 'error':
                if (text) text.textContent = 'Connection Error';
                break;
        }
    }
    
    notifyError(title, message) {
        // You can implement a more sophisticated notification system here
        console.error(`${title}: ${message}`);
        
        // Update status display
        const statusDisplay = document.getElementById('statusDisplay');
        if (statusDisplay) {
            statusDisplay.className = 'status-display error';
            statusDisplay.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>${title}: ${message}</span>`;
        }
    }
    
    // Configuration methods
    updateConfig(config) {
        return this.sendMessage('config', { data: config });
    }
    
    startRecording() {
        return this.sendMessage('start_recording');
    }
    
    stopRecording() {
        return this.sendMessage('stop_recording');
    }
    
    translateText(text) {
        return this.sendMessage('translate_text', { text });
    }
    
    ping() {
        return this.sendMessage('ping');
    }
    
    // Health check
    startHeartbeat(interval = 30000) {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.ping();
            }
        }, interval);
    }
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    // Utility methods
    getConnectionInfo() {
        return {
            isConnected: this.isConnected,
            clientId: this.clientId,
            reconnectAttempts: this.reconnectAttempts,
            wsReadyState: this.ws ? this.ws.readyState : null
        };
    }
    
    setReconnectionConfig(maxAttempts, delay) {
        this.maxReconnectAttempts = maxAttempts;
        this.reconnectDelay = delay;
    }
}
