/**
 * Main Application Controller
 */
class CCDViewerApp {
    constructor() {
        this.initialized = false;
        this.electronAPI = window.electronAPI;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        if (this.initialized) return;

        try {
            console.log('Initializing CCD Viewer...');

            // Wait for DOM to be ready
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', resolve);
                    } else {
                        resolve();
                    }
                });
            }

            // Initialize core systems
            this.initializeStore();
            this.initializeUI();
            this.initializeThemes();
            this.setupElectronIntegration();
            this.setupErrorHandling();

            // Show welcome animation
            this.playWelcomeAnimation();

            this.initialized = true;
            
            // Expose app instance globally for UI components
            window.app = this;
            
            console.log('CCD Viewer initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showCriticalError('Failed to initialize application');
        }
    }

    /**
     * Initialize store
     */
    initializeStore() {
        if (!window.store) {
            throw new Error('Store not available');
        }

        // Set up global state listeners
        window.store.subscribe('*', (key, newValue, oldValue) => {
            console.log(`State changed: ${key}`, { newValue, oldValue });
        });

        console.log('Store initialized');
    }

    /**
     * Initialize UI
     */
    initializeUI() {
        if (!window.uiManager) {
            throw new Error('UI Manager not available');
        }

        window.uiManager.initialize();
        console.log('UI initialized');
    }

    /**
     * Initialize themes
     */
    initializeThemes() {
        if (!window.themeManager) {
            throw new Error('Theme Manager not available');
        }

        // Theme manager initializes itself
        console.log('Themes initialized');
    }

    /**
     * Set up Electron integration
     */
    setupElectronIntegration() {
        if (!this.electronAPI) {
            console.log('Running in browser mode - Electron features disabled');
            return;
        }

        console.log('Setting up Electron integration...');

        // Set up individual menu event handlers
        this.electronAPI.onMenuOpenFile(() => {
            console.log('Menu: Open file');
            this.openFileDialog();
        });
        
        this.electronAPI.onMenuSavePdf(() => {
            console.log('Menu: Save PDF');
            this.exportDocument('pdf');
        });
        
        this.electronAPI.onMenuExportJson(() => {
            console.log('Menu: Export JSON');
            this.exportDocument('json');
        });
        
        this.electronAPI.onMenuExportCsv(() => {
            console.log('Menu: Export CSV');
            this.exportDocument('csv');
        });
        
        this.electronAPI.onMenuTheme((event, theme) => {
            console.log('Menu: Change theme to', theme);
            window.themeManager?.setTheme(theme);
        });

        // Set up additional Electron-specific features
        this.setupElectronFileHandling();
        this.setupElectronDialogs();

        console.log('Electron integration complete');
    }


    /**
     * Open file dialog
     */
    async openFileDialog() {
        if (!this.electronAPI) {
            // Fallback to HTML file input
            document.getElementById('file-input')?.click();
            return;
        }

        try {
            const result = await this.electronAPI.openFileDialog();
            
            if (!result.canceled && result.filePaths.length > 0) {
                const filePath = result.filePaths[0];
                await this.loadFileFromPath(filePath);
            }
        } catch (error) {
            console.error('Failed to open file dialog:', error);
            window.uiManager?.showError('Failed to open file dialog');
        }
    }

    /**
     * Load file from path (Electron)
     */
    async loadFileFromPath(filePath) {
        try {
            window.store?.setLoading(true);

            // Read file using Electron API
            const result = await this.electronAPI.readFile(filePath);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            // Extract filename
            const fileName = filePath.split(/[\\/]/).pop();
            window.store?.setFileName(fileName);

            // Parse document
            const parser = new window.CCDParser();
            const ccdDocument = await parser.parse(result.content);
            
            window.store?.setDocument(ccdDocument);
            window.uiManager?.showToast('Document loaded successfully!', 'success');

        } catch (error) {
            console.error('Failed to load file:', error);
            window.store?.setError(error.message || 'Failed to load file');
        }
    }

    /**
     * Export document
     */
    async exportDocument(format) {
        const ccdDocument = window.store?.getState('document');
        if (!ccdDocument) {
            window.uiManager?.showError('No document to export');
            return;
        }

        try {
            let content, filename, filters;

            switch (format) {
                case 'json':
                    content = window.store?.exportAsJSON();
                    filename = 'ccd-document.json';
                    filters = [{ name: 'JSON Files', extensions: ['json'] }];
                    break;
                case 'csv':
                    content = window.store?.exportAsCSV();
                    filename = 'ccd-document.csv';
                    filters = [{ name: 'CSV Files', extensions: ['csv'] }];
                    break;
                case 'pdf':
                    // Handle PDF export separately using Electron's printToPDF
                    if (this.electronAPI) {
                        const fileName = window.store?.getState('fileName');
                        const pdfFilename = fileName ? 
                            fileName.replace(/\.(xml|ccd|cda)$/i, '.pdf') : 
                            'ccd-document.pdf';
                            
                        const result = await this.electronAPI.exportPDF(pdfFilename, ccdDocument);
                        
                        if (result.success) {
                            window.uiManager?.showToast(`PDF exported to ${result.filePath}`, 'success');
                        } else if (!result.canceled) {
                            throw new Error(result.error || 'Failed to export PDF');
                        }
                    } else {
                        window.uiManager?.showError('PDF export requires Electron');
                    }
                    return;
                default:
                    throw new Error(`Unknown export format: ${format}`);
            }

            if (!content) {
                throw new Error('Failed to generate export content');
            }

            if (this.electronAPI) {
                // Use Electron save dialog
                const result = await this.electronAPI.saveFileDialog(filename, filters);
                
                if (!result.canceled && result.filePath) {
                    const writeResult = await this.electronAPI.writeFile(result.filePath, content);
                    
                    if (writeResult.success) {
                        window.uiManager?.showToast(`Exported to ${result.filePath}`, 'success');
                    } else {
                        throw new Error(writeResult.error);
                    }
                }
            } else {
                // Browser download
                window.uiManager?.downloadFile(content, filename, this.getMimeType(format));
            }

        } catch (error) {
            console.error('Export failed:', error);
            window.uiManager?.showError(`Export failed: ${error.message}`);
        }
    }

    /**
     * Get MIME type for export format
     */
    getMimeType(format) {
        const mimeTypes = {
            json: 'application/json',
            csv: 'text/csv',
            pdf: 'application/pdf'
        };
        return mimeTypes[format] || 'text/plain';
    }

    /**
     * Set up Electron file handling
     */
    setupElectronFileHandling() {
        // Handle file associations and command line arguments
        // This would be implemented for production use
    }

    /**
     * Set up Electron dialogs
     */
    setupElectronDialogs() {
        // Set up custom dialog handling
        // This would be implemented for production use
    }

    /**
     * Set up error handling
     */
    setupErrorHandling() {
        // Global error handlers
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error, 'JavaScript Error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason, 'Promise Rejection');
        });

        console.log('Error handling set up');
    }

    /**
     * Handle application errors
     */
    handleError(error, context = 'Application Error') {
        console.error(`${context}:`, error);

        // Show user-friendly error message
        const message = error?.message || 'An unexpected error occurred';
        window.uiManager?.showError(`${context}: ${message}`);

        // In production, you might want to send error reports here
    }

    /**
     * Show critical error that prevents app from working
     */
    showCriticalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #000;
                color: #ff0000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: monospace;
                font-size: 18px;
                z-index: 10000;
            ">
                <div style="text-align: center;">
                    <h1>CRITICAL ERROR</h1>
                    <p>${message}</p>
                    <p>Please refresh the page or restart the application.</p>
                </div>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    /**
     * Play welcome animation
     */
    playWelcomeAnimation() {
        // Animate the header sliding down
        const header = document.getElementById('header');
        if (header) {
            // The slide-down class is already applied in CSS
            // This could trigger additional welcome animations
        }

        // Stagger in the feature cards
        const features = document.querySelectorAll('.fade-in-delayed');
        features.forEach((feature, index) => {
            feature.style.animationDelay = `${0.4 + index * 0.2}s`;
        });

        console.log('Welcome animation played');
    }

    /**
     * Get application info
     */
    getAppInfo() {
        return {
            name: 'CCD Viewer',
            version: '1.0.0',
            description: 'Modern Healthcare Document Viewer',
            isElectron: !!this.electronAPI,
            initialized: this.initialized
        };
    }

    /**
     * Cleanup and shutdown
     */
    shutdown() {
        console.log('Shutting down CCD Viewer...');
        
        // Clean up any resources
        if (this.electronAPI) {
            this.electronAPI.removeAllListeners();
        }

        // Clear any timers or intervals
        // Clean up event listeners
        // Save any necessary state

        console.log('CCD Viewer shutdown complete');
    }
}

// Initialize the application
const app = new CCDViewerApp();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.initialize();
    });
} else {
    app.initialize();
}

// Make app available globally for debugging
window.ccdViewerApp = app;

// Handle app shutdown
window.addEventListener('beforeunload', () => {
    app.shutdown();
});