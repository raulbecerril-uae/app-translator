class RealTimeTranslationApp {
    constructor() {
        this.wsClient = new WebSocketClient();
        this.audioProcessor = new AudioProcessor();
        this.translationHistory = [];
        this.currentConfig = {
            sourceLang: 'en',
            targetLang: 'ar',
            sampleRate: 16000,
            autoTranslate: true,
            saveHistory: true
        };
        
        this.isRecording = false;
        this.currentTranscript = '';
        
        this.initializeApp();
    }
    
    async initializeApp() {
        try {
            console.log('🚀 Initializing Real-Time Translation App');
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup WebSocket message handlers
            this.setupWebSocketHandlers();
            
            // Setup audio processor callbacks
            this.setupAudioProcessorCallbacks();
        
        // Check for network issues and show alert if needed
        this.checkNetworkIssues();
            
            // Initialize audio processor
            console.log('🎤 Initializing audio processor...');
            const audioInitialized = await this.audioProcessor.initialize();
            if (!audioInitialized) {
                console.error('❌ Audio processor initialization failed');
                this.showError('Audio initialization failed', 'Microphone access required for speech recognition');
            } else {
                console.log('✅ Audio processor initialized successfully');
            }
            
            // Connect to WebSocket server
            await this.connectToServer();
            
            // Load saved settings
            this.loadSettings();
            
            // Update language labels
            this.updateLanguageLabels();
            
            this.showStatus('Ready to translate! Select languages and start recording.', 'success');
            
        } catch (error) {
            console.error('App initialization failed:', error);
            this.showError('Initialization Failed', error.message);
        }
    }
    
    async connectToServer() {
        try {
            await this.wsClient.connect('ws://localhost:8080');
            console.log('✅ Connected to server');
        } catch (error) {
            console.warn('⚠️ Server connection failed, using fallback mode');
            this.showError('Server Connection Failed', 'Using offline mode with Web Speech API');
        }
    }
    
    setupEventListeners() {
        // Recording controls
        document.getElementById('startRecording')?.addEventListener('click', () => this.startRecording());
        document.getElementById('stopRecording')?.addEventListener('click', () => this.stopRecording());
        document.getElementById('clearAll')?.addEventListener('click', () => this.clearAll());
        
        // Language controls
        document.getElementById('sourceLang')?.addEventListener('change', (e) => this.updateSourceLanguage(e.target.value));
        document.getElementById('targetLang')?.addEventListener('change', (e) => this.updateTargetLanguage(e.target.value));
        document.getElementById('swapLanguages')?.addEventListener('click', () => this.swapLanguages());
        
        // Text controls
        document.getElementById('translateText')?.addEventListener('click', () => this.translateCurrentText());
        document.getElementById('playOriginal')?.addEventListener('click', () => this.playText('original'));
        document.getElementById('playTranslation')?.addEventListener('click', () => this.playText('translation'));
        document.getElementById('copyOriginal')?.addEventListener('click', () => this.copyText('original'));
        document.getElementById('copyTranslation')?.addEventListener('click', () => this.copyText('translation'));
        document.getElementById('downloadTranscript')?.addEventListener('click', () => this.downloadTranscript());
        
        // History controls
        document.getElementById('clearHistory')?.addEventListener('click', () => this.clearHistory());
        
        // Settings controls
        document.getElementById('openSettings')?.addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings')?.addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettings')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('resetSettings')?.addEventListener('click', () => this.resetSettings());
        
        // Text area input
        const originalTextArea = document.getElementById('originalText');
        if (originalTextArea) {
            originalTextArea.addEventListener('input', () => this.handleTextInput());
            originalTextArea.addEventListener('paste', (e) => this.handleTextPaste(e));
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Modal overlay click
        document.getElementById('settingsModal')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeSettings();
            }
        });
        
        // Window events
        window.addEventListener('beforeunload', () => this.cleanup());
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }
    
    setupWebSocketHandlers() {
        this.wsClient.onMessage('transcript', (data) => {
            this.handleTranscript(data.text, false);
        });
        
        this.wsClient.onMessage('final_transcript', (data) => {
            this.handleTranscript(data.text, true);
        });
        
        this.wsClient.onMessage('translation', (data) => {
            this.handleTranslation(data);
        });
        
        this.wsClient.onMessage('recording', (data) => {
            this.showStatus(data.message, data.status === 'started' ? 'success' : '');
        });
        
        this.wsClient.onConnection((status) => {
            this.handleConnectionStatusChange(status);
        });
    }
    
    setupAudioProcessorCallbacks() {
        this.audioProcessor.notifyRecordingStart = () => {
            this.updateRecordingUI(true);
        };
        
        this.audioProcessor.notifyRecordingStop = () => {
            this.updateRecordingUI(false);
        };
        
        this.audioProcessor.notifyTranscript = (text, isFinal) => {
            this.handleTranscript(text, isFinal);
        };
        
        this.audioProcessor.notifyError = (title, message) => {
            this.showError(title, message);
        };
    }
    
    async startRecording() {
        console.log('🎤 App: startRecording() called');
        
        if (this.isRecording) {
            console.warn('⚠️ App: Already recording');
            this.showError('Already Recording', 'Please stop current recording first');
            return;
        }
        
        try {
            console.log('🎯 App: Setting recording state to true');
            this.isRecording = true;
            this.currentTranscript = '';
            this.clearCurrentText();
            
            // Update configuration
            console.log('⚙️ App: Updating server configuration...');
            await this.updateServerConfig();
            
            // Start audio processing
            console.log('🎤 App: Starting audio processor...');
            const success = await this.audioProcessor.startRecording(this.wsClient);
            console.log(`🎤 App: Audio processor returned: ${success}`);
            
            if (success) {
                console.log('✅ App: Recording started successfully');
                this.showStatus('🎤 Recording started - speak clearly!', 'success');
            } else {
                console.error('❌ App: Recording failed to start');
                this.isRecording = false;
                this.showError('Recording Failed', 'Unable to start audio recording');
            }
            
        } catch (error) {
            console.error('❌ App: Start recording error:', error);
            this.isRecording = false;
            this.showError('Recording Error', error.message);
        }
    }
    
    stopRecording() {
        if (!this.isRecording) {
            this.showStatus('Not currently recording', 'warning');
            return;
        }
        
        try {
            this.isRecording = false;
            this.audioProcessor.stopRecording();
            this.showStatus('🛑 Recording stopped - processing audio...', '');
            
        } catch (error) {
            console.error('Stop recording error:', error);
            this.showError('Stop Recording Error', error.message);
        }
    }
    
    clearAll() {
        this.stopRecording();
        this.clearCurrentText();
        this.showStatus('🧹 Cleared all text', '');
    }
    
    clearCurrentText() {
        const originalText = document.getElementById('originalText');
        const translatedText = document.getElementById('translatedText');
        
        if (originalText) {
            originalText.innerHTML = '<div class="placeholder">Speak or type your text here...</div>';
        }
        
        if (translatedText) {
            translatedText.innerHTML = '<div class="placeholder">Translation will appear here...</div>';
        }
        
        this.currentTranscript = '';
        this.updateActionButtons();
    }
    
    handleTranscript(text, isFinal) {
        if (!text) return;
        
        const originalTextArea = document.getElementById('originalText');
        if (!originalTextArea) return;
        
        if (isFinal) {
            this.currentTranscript = text;
            originalTextArea.innerHTML = text;
            
            // Auto-translate if enabled
            if (this.currentConfig.autoTranslate) {
                this.translateCurrentText();
            }
        } else {
            // Show interim results with different styling
            originalTextArea.innerHTML = `<span style="opacity: 0.7">${text}</span>`;
        }
        
        this.updateActionButtons();
    }
    
    handleTranslation(data) {
        const translatedTextArea = document.getElementById('translatedText');
        if (!translatedTextArea) return;
        
        translatedTextArea.innerHTML = data.translatedText;
        
        // Add to history
        if (this.currentConfig.saveHistory) {
            this.addToHistory({
                original: data.originalText,
                translated: data.translatedText,
                sourceLang: data.sourceLang,
                targetLang: data.targetLang,
                timestamp: new Date(data.timestamp)
            });
        }
        
        this.updateActionButtons();
        this.showStatus('✅ Translation complete!', 'success');
    }
    
    async translateCurrentText() {
        const originalText = document.getElementById('originalText');
        if (!originalText) return;
        
        const text = originalText.textContent || originalText.innerText;
        if (!text || text.trim() === '' || text.includes('Speak or type')) {
            this.showStatus('💭 Enter some text to translate', 'warning');
            return;
        }
        
        this.showStatus('🔄 Translating...', '');
        
        try {
            if (this.wsClient.isConnected) {
                // Use WebSocket server
                this.wsClient.translateText(text.trim());
            } else {
                // Use fallback translation
                await this.translateWithFallback(text.trim());
            }
        } catch (error) {
            console.error('Translation error:', error);
            this.showError('Translation Failed', error.message);
        }
    }
    
    async translateWithFallback(text) {
        // Simple fallback translation using local dictionary
        const translations = {
            'hello': 'مرحبا',
            'thank you': 'شكرا لك',
            'how are you': 'كيف حالك',
            'good morning': 'صباح الخير',
            'good evening': 'مساء الخير'
        };
        
        const lowerText = text.toLowerCase();
        let translation = translations[lowerText];
        
        if (!translation) {
            // Word-by-word fallback
            const words = lowerText.split(' ');
            const translatedWords = words.map(word => translations[word] || word);
            translation = translatedWords.join(' ');
        }
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.handleTranslation({
            originalText: text,
            translatedText: translation || `[Translation not available: ${text}]`,
            sourceLang: this.currentConfig.sourceLang,
            targetLang: this.currentConfig.targetLang,
            timestamp: new Date().toISOString()
        });
    }
    
    updateRecordingUI(recording) {
        const startBtn = document.getElementById('startRecording');
        const stopBtn = document.getElementById('stopRecording');
        
        if (startBtn && stopBtn) {
            startBtn.disabled = recording;
            stopBtn.disabled = !recording;
            
            if (recording) {
                startBtn.classList.add('recording');
            } else {
                startBtn.classList.remove('recording');
            }
        }
    }
    
    updateActionButtons() {
        const originalText = document.getElementById('originalText')?.textContent || '';
        const translatedText = document.getElementById('translatedText')?.textContent || '';
        
        const hasOriginal = originalText && !originalText.includes('Speak or type');
        const hasTranslation = translatedText && !translatedText.includes('Translation will appear');
        
        // Update button states
        document.getElementById('playOriginal').disabled = !hasOriginal;
        document.getElementById('copyOriginal').disabled = !hasOriginal;
        document.getElementById('translateText').disabled = !hasOriginal;
        document.getElementById('playTranslation').disabled = !hasTranslation;
        document.getElementById('copyTranslation').disabled = !hasTranslation;
    }
    
    handleTextInput() {
        const originalText = document.getElementById('originalText');
        if (!originalText) return;
        
        // Remove placeholder if text is entered
        const placeholder = originalText.querySelector('.placeholder');
        if (placeholder && originalText.textContent.trim()) {
            placeholder.remove();
        }
        
        this.updateActionButtons();
        
        // Auto-translate after pause in typing
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            if (this.currentConfig.autoTranslate) {
                this.translateCurrentText();
            }
        }, 1000);
    }
    
    handleTextPaste(event) {
        event.preventDefault();
        const text = (event.clipboardData || window.clipboardData).getData('text');
        const originalText = document.getElementById('originalText');
        
        if (originalText && text) {
            originalText.innerHTML = text;
            this.handleTextInput();
        }
    }
    
    async updateServerConfig() {
        if (this.wsClient.isConnected) {
            await this.wsClient.updateConfig(this.currentConfig);
        }
        
        // Update audio processor config
        this.audioProcessor.updateConfiguration({
            sampleRate: this.currentConfig.sampleRate,
            language: this.getLanguageCode(this.currentConfig.sourceLang)
        });
    }
    
    updateSourceLanguage(lang) {
        this.currentConfig.sourceLang = lang;
        this.updateLanguageLabels();
        this.updateServerConfig();
        this.saveSettings();
    }
    
    updateTargetLanguage(lang) {
        this.currentConfig.targetLang = lang;
        this.updateLanguageLabels();
        this.updateServerConfig();
        this.saveSettings();
    }
    
    swapLanguages() {
        const temp = this.currentConfig.sourceLang;
        this.currentConfig.sourceLang = this.currentConfig.targetLang;
        this.currentConfig.targetLang = temp;
        
        // Update UI
        document.getElementById('sourceLang').value = this.currentConfig.sourceLang;
        document.getElementById('targetLang').value = this.currentConfig.targetLang;
        
        this.updateLanguageLabels();
        this.updateServerConfig();
        this.saveSettings();
    }
    
    updateLanguageLabels() {
        const languages = {
            'en': 'English',
            'ar': 'Arabic',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German'
        };
        
        const sourceLabel = document.getElementById('sourceLanguageLabel');
        const targetLabel = document.getElementById('targetLanguageLabel');
        
        if (sourceLabel) sourceLabel.textContent = languages[this.currentConfig.sourceLang] || 'Unknown';
        if (targetLabel) targetLabel.textContent = languages[this.currentConfig.targetLang] || 'Unknown';
    }
    
    getLanguageCode(lang) {
        const codes = {
            'en': 'en-US',
            'ar': 'ar-SA',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE'
        };
        return codes[lang] || 'en-US';
    }
    
    // Text-to-speech functionality
    playText(type) {
        const element = type === 'original' ? 
            document.getElementById('originalText') : 
            document.getElementById('translatedText');
        
        if (!element) return;
        
        const text = element.textContent || element.innerText;
        if (!text || text.includes('appear here') || text.includes('Speak or type')) {
            this.showStatus('No text to play', 'warning');
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = type === 'original' ? 
            this.getLanguageCode(this.currentConfig.sourceLang) : 
            this.getLanguageCode(this.currentConfig.targetLang);
        
        speechSynthesis.speak(utterance);
    }
    
    // Copy to clipboard functionality
    async copyText(type) {
        const element = type === 'original' ? 
            document.getElementById('originalText') : 
            document.getElementById('translatedText');
        
        if (!element) return;
        
        const text = element.textContent || element.innerText;
        if (!text || text.includes('appear here') || text.includes('Speak or type')) {
            this.showStatus('No text to copy', 'warning');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(text);
            this.showStatus('✅ Text copied to clipboard', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showError('Copy Failed', 'Unable to copy text to clipboard');
        }
    }
    
    // History management
    addToHistory(item) {
        this.translationHistory.unshift(item);
        
        // Limit history size
        if (this.translationHistory.length > 50) {
            this.translationHistory = this.translationHistory.slice(0, 50);
        }
        
        this.updateHistoryDisplay();
        this.saveHistoryToStorage();
    }
    
    updateHistoryDisplay() {
        const historyContainer = document.getElementById('translationHistory');
        if (!historyContainer) return;
        
        if (this.translationHistory.length === 0) {
            historyContainer.innerHTML = `
                <div class="history-placeholder">
                    <i class="fas fa-clock"></i>
                    <p>Your translation history will appear here</p>
                </div>
            `;
            return;
        }
        
        historyContainer.innerHTML = this.translationHistory.map(item => `
            <div class="history-item fade-in-up">
                <div class="history-item-header">
                    <span>${item.sourceLang.toUpperCase()} → ${item.targetLang.toUpperCase()}</span>
                    <span>${item.timestamp.toLocaleTimeString()}</span>
                </div>
                <div class="history-item-content">
                    <div class="history-original">${item.original}</div>
                    <div class="history-translation">${item.translated}</div>
                </div>
            </div>
        `).join('');
    }
    
    clearHistory() {
        this.translationHistory = [];
        this.updateHistoryDisplay();
        this.saveHistoryToStorage();
        this.showStatus('🧹 History cleared', '');
    }
    
    // Download functionality
    downloadTranscript() {
        if (this.translationHistory.length === 0) {
            this.showStatus('No history to download', 'warning');
            return;
        }
        
        const content = this.translationHistory.map(item => 
            `[${item.timestamp.toLocaleString()}] ${item.sourceLang.toUpperCase()} → ${item.targetLang.toUpperCase()}\n` +
            `Original: ${item.original}\n` +
            `Translation: ${item.translated}\n\n`
        ).join('');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translation-history-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showStatus('📥 Transcript downloaded', 'success');
    }
    
    // Settings management
    openSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('active');
            this.loadSettingsToUI();
        }
    }
    
    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    loadSettingsToUI() {
        document.getElementById('audioQuality').value = this.currentConfig.sampleRate;
        document.getElementById('autoTranslate').checked = this.currentConfig.autoTranslate;
        document.getElementById('saveHistory').checked = this.currentConfig.saveHistory;
    }
    
    saveSettings() {
        // Get values from UI
        this.currentConfig.sampleRate = parseInt(document.getElementById('audioQuality').value);
        this.currentConfig.autoTranslate = document.getElementById('autoTranslate').checked;
        this.currentConfig.saveHistory = document.getElementById('saveHistory').checked;
        
        // Save to localStorage
        localStorage.setItem('translationAppConfig', JSON.stringify(this.currentConfig));
        
        // Update server config
        this.updateServerConfig();
        
        this.closeSettings();
        this.showStatus('⚙️ Settings saved', 'success');
    }
    
    resetSettings() {
        this.currentConfig = {
            sourceLang: 'en',
            targetLang: 'ar',
            sampleRate: 16000,
            autoTranslate: true,
            saveHistory: true
        };
        
        this.loadSettingsToUI();
        this.updateLanguageLabels();
        
        // Update UI selects
        document.getElementById('sourceLang').value = this.currentConfig.sourceLang;
        document.getElementById('targetLang').value = this.currentConfig.targetLang;
        
        this.showStatus('⚙️ Settings reset to defaults', '');
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('translationAppConfig');
            if (saved) {
                this.currentConfig = { ...this.currentConfig, ...JSON.parse(saved) };
            }
            
            // Update UI
            document.getElementById('sourceLang').value = this.currentConfig.sourceLang;
            document.getElementById('targetLang').value = this.currentConfig.targetLang;
            
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    saveHistoryToStorage() {
        if (this.currentConfig.saveHistory) {
            try {
                localStorage.setItem('translationHistory', JSON.stringify(this.translationHistory));
            } catch (error) {
                console.error('Error saving history:', error);
            }
        }
    }
    
    loadHistoryFromStorage() {
        if (this.currentConfig.saveHistory) {
            try {
                const saved = localStorage.getItem('translationHistory');
                if (saved) {
                    this.translationHistory = JSON.parse(saved).map(item => ({
                        ...item,
                        timestamp: new Date(item.timestamp)
                    }));
                    this.updateHistoryDisplay();
                }
            } catch (error) {
                console.error('Error loading history:', error);
            }
        }
    }
    
    // Keyboard shortcuts
    handleKeyboardShortcuts(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'r':
                    event.preventDefault();
                    if (this.isRecording) {
                        this.stopRecording();
                    } else {
                        this.startRecording();
                    }
                    break;
                case 't':
                    event.preventDefault();
                    this.translateCurrentText();
                    break;
                case 'l':
                    event.preventDefault();
                    this.clearAll();
                    break;
                case ',':
                    event.preventDefault();
                    this.openSettings();
                    break;
            }
        }
        
        if (event.key === 'Escape') {
            this.closeSettings();
        }
    }
    
    // Connection status handling
    handleConnectionStatusChange(status) {
        switch (status) {
            case 'connected':
                this.showStatus('🔗 Connected to server', 'success');
                break;
            case 'disconnected':
                this.showStatus('⚠️ Disconnected from server - using offline mode', 'warning');
                break;
            case 'error':
                this.showStatus('❌ Connection error - using offline mode', 'error');
                break;
        }
    }
    
    handleOnlineStatus(online) {
        if (online) {
            this.showStatus('🌐 Back online - attempting to reconnect...', 'success');
            this.connectToServer();
        } else {
            this.showStatus('📡 Offline - using local speech recognition', 'warning');
        }
    }
    
    // UI status methods
    showStatus(message, type = '') {
        const statusDisplay = document.getElementById('statusDisplay');
        if (!statusDisplay) return;
        
        statusDisplay.className = `status-display ${type}`;
        statusDisplay.innerHTML = `<i class="fas fa-info-circle"></i><span>${message}</span>`;
        
        // Auto-clear success messages
        if (type === 'success') {
            setTimeout(() => {
                if (statusDisplay.textContent === message) {
                    this.showStatus('Ready for input', '');
                }
            }, 3000);
        }
    }
    
    showError(title, message) {
        // Add network error specific handling
        if (title.includes('Network') || message.includes('network') || message.includes('internet')) {
            message += '\n\n🔧 Click here for network troubleshooting: /network-solution.html';
        }
        
        this.showStatus(`❌ ${title}: ${message}`, 'error');
        console.error(`${title}:`, message);
        
        // For critical errors, also show more detailed help
        if (title.includes('Network') || title.includes('Permission')) {
            setTimeout(() => {
                if (confirm('Would you like to open the troubleshooting guide?')) {
                    window.open('/network-solution.html', '_blank');
                }
            }, 1000);
        }
    }
    
    // Cleanup
    cleanup() {
        this.stopRecording();
        this.audioProcessor.cleanup();
        this.wsClient.disconnect();
        this.saveHistoryToStorage();
    }
    
    // Check for network issues with Google Speech API
    async checkNetworkIssues() {
        try {
            // Quick test of speech recognition availability
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const testRecognition = new SpeechRecognition();
                
                let networkIssueDetected = false;
                
                testRecognition.onerror = (event) => {
                    if (event.error === 'network') {
                        networkIssueDetected = true;
                        document.getElementById('networkAlert').style.display = 'block';
                        console.warn('🌐 Network issue detected with Google Speech API');
                    }
                };
                
                // Start and immediately stop to test connectivity
                testRecognition.start();
                setTimeout(() => {
                    try {
                        testRecognition.stop();
                    } catch (e) {
                        // Ignore errors on stop
                    }
                }, 100);
            }
        } catch (error) {
            console.warn('Network check failed:', error);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.translationApp = new RealTimeTranslationApp();
});
