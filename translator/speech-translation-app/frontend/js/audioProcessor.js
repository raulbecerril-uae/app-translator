class AudioProcessor {
    constructor() {
        this.speechRecognition = null;
        this.isRecording = false;
        this.isListening = false;
        
        // Audio visualization
        this.canvas = null;
        this.canvasContext = null;
        this.animationFrame = null;
        
        this.setupAudioVisualization();
        this.initializeSpeechRecognition();
    }
    
    async initialize() {
        try {
            console.log('🎤 Initializing Audio Processor...');
            
            if (this.speechRecognition) {
                console.log('✅ Web Speech API available');
                return true;
            } else {
                console.warn('❌ Speech recognition not available');
                return false;
            }
        } catch (error) {
            console.error('Audio initialization failed:', error);
            return false;
        }
    }
    
    initializeSpeechRecognition() {
        console.log('🗣️ Checking speech recognition support...');
        console.log('🌐 Browser:', navigator.userAgent);
        console.log('🔍 webkitSpeechRecognition available:', 'webkitSpeechRecognition' in window);
        console.log('🔍 SpeechRecognition available:', 'SpeechRecognition' in window);
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('❌ Speech recognition not supported in this browser');
            return false;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.speechRecognition = new SpeechRecognition();
        
        // Optimized settings for real-time translation
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.lang = 'en-US';
        this.speechRecognition.maxAlternatives = 1;
        
        console.log('⚙️ Speech recognition configured:', {
            continuous: this.speechRecognition.continuous,
            interimResults: this.speechRecognition.interimResults,
            lang: this.speechRecognition.lang,
            maxAlternatives: this.speechRecognition.maxAlternatives
        });
        
        this.speechRecognition.onstart = () => {
            console.log('🎤 Speech recognition started');
            this.isListening = true;
            this.notifyRecordingStart();
            this.startSimpleVisualization();
        };
        
        this.speechRecognition.onresult = (event) => {
            console.log('📝 Speech recognition result event:', event);
            console.log('📊 Results length:', event.results.length);
            
            let finalTranscript = '';
            let interimTranscript = '';
            
            // Process all results
            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript;
                console.log(`📝 Result ${i}: isFinal=${result.isFinal}, transcript="${transcript}"`);
                
                if (result.isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Notify with the latest transcript
            if (finalTranscript.trim()) {
                console.log('📝 Final transcript:', finalTranscript.trim());
                this.notifyTranscript(finalTranscript.trim(), true);
            } else if (interimTranscript.trim()) {
                console.log('📝 Interim transcript:', interimTranscript.trim());
                this.notifyTranscript(interimTranscript.trim(), false);
            }
        };
        
        this.speechRecognition.onerror = (event) => {
            console.error('🚫 Speech recognition error:', event.error);
            console.error('🚫 Full error details:', event);
            
            if (event.error === 'network') {
                console.error('🌐 NETWORK ERROR: Speech recognition requires internet connection');
                console.error('💡 Solutions: Check internet, try different browser, check firewall');
                this.notifyError('Network Error', 'Speech recognition requires internet connection. Check your connection and try again.');
                this.stopRecording();
                return;
            } else if (event.error === 'no-speech') {
                console.log('⚠️ No speech detected - continuing to listen...');
                return; // Don't stop on no-speech, just keep listening
            } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                console.error('❌ Microphone permission denied!');
                this.notifyError('Microphone Permission Denied', 'Please allow microphone access and try again.');
                this.stopRecording();
                return;
            } else if (event.error === 'audio-capture') {
                console.error('❌ Audio capture failed - microphone may be in use');
                this.notifyError('Audio Capture Failed', 'Microphone may be in use by another application.');
                this.stopRecording();
                return;
            } else if (event.error === 'service-not-allowed') {
                console.error('❌ Speech service not allowed - may be blocked by firewall');
                this.notifyError('Service Blocked', 'Speech recognition service may be blocked by firewall or corporate network.');
                this.stopRecording();
                return;
            }
            
            this.notifyError('Speech Recognition Error', event.error);
            this.stopRecording();
        };
        
        this.speechRecognition.onend = () => {
            console.log('🛑 Speech recognition ended');
            this.isListening = false;
            this.stopSimpleVisualization();
            this.notifyRecordingStop();
        };
        
        console.log('✅ Speech recognition initialized successfully');
        return true;
    }
    
    setupAudioVisualization() {
        this.canvas = document.getElementById('visualizerCanvas');
        if (this.canvas) {
            this.canvasContext = this.canvas.getContext('2d');
        }
    }
    
    async startRecording(wsClient) {
        if (this.isRecording) {
            console.warn('Already recording');
            return false;
        }
        
        console.log('🎤 Starting recording...');
        
        try {
            // Check network connectivity first
            console.log('🌐 Checking network connectivity for speech recognition...');
            if (!navigator.onLine) {
                throw new Error('No internet connection - Speech recognition requires internet access');
            }
            
            // Request microphone permission first
            console.log('📋 Requesting microphone permission...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            console.log('✅ Microphone access granted');
            console.log('🎵 Audio stream details:', {
                active: stream.active,
                tracks: stream.getAudioTracks().length,
                trackSettings: stream.getAudioTracks()[0]?.getSettings()
            });
            
            // Stop the stream since we just needed permission
            stream.getTracks().forEach(track => track.stop());
            
            this.isRecording = true;
            this.wsClient = wsClient;
            
            if (this.speechRecognition) {
                console.log('🎤 Starting Web Speech API recognition...');
                this.speechRecognition.start();
                return true;
            } else {
                throw new Error('Speech recognition not available');
            }
            
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            this.isRecording = false;
            
            if (error.message.includes('internet') || error.message.includes('network')) {
                this.notifyError('Network Required', 'Speech recognition requires internet connection. Please check your connection and try again.');
            } else if (error.name === 'NotAllowedError') {
                this.notifyError('Microphone Permission Denied', 'Please allow microphone access in your browser and try again.');
            } else if (error.name === 'NotFoundError') {
                this.notifyError('No Microphone Found', 'Please connect a microphone and try again.');
            } else if (error.name === 'NotSupportedError') {
                this.notifyError('Browser Not Supported', 'Speech recognition is not supported in this browser. Try Chrome or Edge.');
            } else {
                this.notifyError('Recording Error', 'Microphone access required: ' + error.message);
            }
            
            return false;
        }
    }
    
    stopRecording() {
        if (!this.isRecording) {
            console.warn('Not currently recording');
            return false;
        }
        
        console.log('🛑 Stopping recording...');
        this.isRecording = false;
        
        try {
            if (this.speechRecognition && this.isListening) {
                this.speechRecognition.stop();
            }
            
            this.stopSimpleVisualization();
            return true;
            
        } catch (error) {
            console.error('❌ Failed to stop recording:', error);
            this.notifyError('Stop Recording Error', error.message);
            return false;
        }
    }
    
    startSimpleVisualization() {
        const visualizer = document.getElementById('audioVisualizer');
        if (visualizer) {
            visualizer.classList.add('active');
        }
        
        if (!this.canvas || !this.canvasContext) return;
        
        // Simple animated visualization
        let phase = 0;
        const animate = () => {
            if (!this.isListening) return;
            
            this.animationFrame = requestAnimationFrame(animate);
            
            const width = this.canvas.width;
            const height = this.canvas.height;
            
            // Clear canvas
            this.canvasContext.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.canvasContext.fillRect(0, 0, width, height);
            
            // Draw animated waveform
            this.canvasContext.strokeStyle = '#00ff88';
            this.canvasContext.lineWidth = 2;
            this.canvasContext.beginPath();
            
            for (let x = 0; x < width; x++) {
                const y = height / 2 + Math.sin((x * 0.02) + phase) * 30 * Math.sin(phase * 0.1);
                if (x === 0) {
                    this.canvasContext.moveTo(x, y);
                } else {
                    this.canvasContext.lineTo(x, y);
                }
            }
            
            this.canvasContext.stroke();
            phase += 0.1;
        };
        
        animate();
    }
    
    stopSimpleVisualization() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        const visualizer = document.getElementById('audioVisualizer');
        if (visualizer) {
            visualizer.classList.remove('active');
        }
        
        if (this.canvasContext) {
            this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    updateConfiguration(config) {
        if (config.language && this.speechRecognition) {
            this.speechRecognition.lang = config.language;
            console.log('🔄 Updated language to:', config.language);
        }
    }
    
    cleanup() {
        this.stopRecording();
        this.stopSimpleVisualization();
        
        if (this.speechRecognition) {
            this.speechRecognition.abort();
        }
    }
    
    // Event notification methods (to be overridden by app)
    notifyRecordingStart() {
        console.log('🎤 Recording started notification');
    }
    
    notifyRecordingStop() {
        console.log('🛑 Recording stopped notification');
    }
    
    notifyTranscript(text, isFinal) {
        console.log('📝 Transcript notification:', text, 'Final:', isFinal);
    }
    
    notifyError(title, message) {
        console.error(`❌ ${title}: ${message}`);
    }
    
    // Utility methods
    async getAudioDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'audioinput');
        } catch (error) {
            console.error('Error getting audio devices:', error);
            return [];
        }
    }
    
    getVolumeLevel() {
        // Simple volume level simulation
        return this.isListening ? Math.random() * 0.5 + 0.3 : 0;
    }
}
