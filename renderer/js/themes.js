/**
 * Theme management system
 */
class ThemeManager {
    constructor() {
        this.themes = {
            winamp: {
                name: 'Classic Winamp',
                description: 'Nostalgic green terminal vibes',
                effects: {
                    scanlines: true,
                    noise: false,
                    glow: true
                }
            },
            healthcare: {
                name: 'Healthcare Blue',
                description: 'Professional medical interface',
                effects: {
                    scanlines: false,
                    noise: false,
                    glow: false
                }
            },
            dark: {
                name: 'Dark Mode',
                description: 'Easy on the eyes',
                effects: {
                    scanlines: false,
                    noise: false,
                    glow: true
                }
            },
            contrast: {
                name: 'High Contrast',
                description: 'Maximum accessibility',
                effects: {
                    scanlines: false,
                    noise: false,
                    glow: false
                }
            },
            vapor: {
                name: 'Vaporwave',
                description: 'Aesthetic 80s vibes',
                effects: {
                    scanlines: true,
                    noise: true,
                    glow: true
                }
            },
            matrix: {
                name: 'Matrix',
                description: 'Follow the white rabbit',
                effects: {
                    scanlines: false,
                    noise: true,
                    glow: true,
                    matrixRain: true
                }
            }
        };

        this.currentTheme = 'winamp';
        this.effectsEnabled = true;
    }

    /**
     * Apply theme to the document
     */
    applyTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Theme "${themeName}" not found`);
            return;
        }

        const body = document.body;
        
        // Remove existing theme classes
        Object.keys(this.themes).forEach(theme => {
            body.classList.remove(`theme-${theme}`);
        });

        // Add new theme class
        body.classList.add(`theme-${themeName}`);
        
        // Apply effects
        this.applyEffects(themeName);
        
        // Update current theme
        this.currentTheme = themeName;
        
        // Trigger custom event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeName, config: this.themes[themeName] }
        }));

        // Show notification
        this.showThemeChangeNotification(this.themes[themeName].name);
    }

    /**
     * Apply visual effects based on theme
     */
    applyEffects(themeName) {
        const effects = this.themes[themeName]?.effects || {};
        const body = document.body;

        // Scanlines
        if (effects.scanlines && this.effectsEnabled) {
            body.classList.add('scanlines');
        } else {
            body.classList.remove('scanlines');
        }

        // Noise
        if (effects.noise && this.effectsEnabled) {
            body.classList.add('noise');
        } else {
            body.classList.remove('noise');
        }

        // Matrix rain effect
        if (effects.matrixRain && this.effectsEnabled) {
            this.enableMatrixRain();
        } else {
            this.disableMatrixRain();
        }

        // Update glow effects
        if (effects.glow) {
            this.updateGlowIntensity(themeName);
        }
    }

    /**
     * Enable matrix rain effect
     */
    enableMatrixRain() {
        let matrixContainer = document.querySelector('.matrix-rain-container');
        
        if (!matrixContainer) {
            matrixContainer = document.createElement('div');
            matrixContainer.className = 'matrix-rain-container fixed inset-0 pointer-events-none z-0';
            matrixContainer.style.overflow = 'hidden';
            
            // Create multiple columns of falling characters
            for (let i = 0; i < 20; i++) {
                const column = document.createElement('div');
                column.className = 'matrix-column';
                column.style.cssText = `
                    position: absolute;
                    top: -100%;
                    left: ${i * 5}%;
                    width: 20px;
                    color: rgba(0, 255, 65, 0.1);
                    font-family: monospace;
                    font-size: 14px;
                    line-height: 16px;
                    animation: matrix-fall ${10 + Math.random() * 20}s linear infinite;
                    animation-delay: ${Math.random() * 5}s;
                `;
                
                // Add random characters
                let chars = '';
                for (let j = 0; j < 50; j++) {
                    chars += Math.random() > 0.5 ? '1' : '0';
                    if (j % 10 === 9) chars += '\n';
                }
                column.textContent = chars;
                
                matrixContainer.appendChild(column);
            }
            
            document.body.appendChild(matrixContainer);
        }
    }

    /**
     * Disable matrix rain effect
     */
    disableMatrixRain() {
        const matrixContainer = document.querySelector('.matrix-rain-container');
        if (matrixContainer) {
            matrixContainer.remove();
        }
    }

    /**
     * Update glow intensity based on theme
     */
    updateGlowIntensity(themeName) {
        const style = document.createElement('style');
        style.id = 'dynamic-glow-styles';
        
        // Remove existing dynamic styles
        const existing = document.getElementById('dynamic-glow-styles');
        if (existing) {
            existing.remove();
        }

        let glowCSS = '';
        
        switch (themeName) {
            case 'winamp':
                glowCSS = `
                    .theme-winamp .glow {
                        filter: drop-shadow(0 0 6px var(--color-primary)) 
                                drop-shadow(0 0 12px var(--color-primary));
                    }
                `;
                break;
            case 'vapor':
                glowCSS = `
                    .theme-vapor .glow {
                        filter: drop-shadow(0 0 8px var(--color-primary)) 
                                drop-shadow(0 0 16px var(--color-primary))
                                drop-shadow(0 0 24px var(--color-secondary));
                    }
                `;
                break;
            case 'matrix':
                glowCSS = `
                    .theme-matrix .glow {
                        filter: drop-shadow(0 0 6px var(--color-primary)) 
                                drop-shadow(0 0 12px var(--color-primary))
                                drop-shadow(0 0 18px var(--color-primary));
                    }
                `;
                break;
        }

        if (glowCSS) {
            style.textContent = glowCSS;
            document.head.appendChild(style);
        }
    }

    /**
     * Cycle to next theme
     */
    nextTheme() {
        const themeNames = Object.keys(this.themes);
        const currentIndex = themeNames.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        
        this.applyTheme(themeNames[nextIndex]);
        return themeNames[nextIndex];
    }

    /**
     * Get current theme info
     */
    getCurrentTheme() {
        return {
            name: this.currentTheme,
            config: this.themes[this.currentTheme]
        };
    }

    /**
     * Get all available themes
     */
    getThemes() {
        return { ...this.themes };
    }

    /**
     * Toggle effects on/off
     */
    toggleEffects() {
        this.effectsEnabled = !this.effectsEnabled;
        this.applyEffects(this.currentTheme);
        return this.effectsEnabled;
    }

    /**
     * Show theme change notification
     */
    showThemeChangeNotification(themeName) {
        // Create or get toast container
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-4 right-4 z-50';
            document.body.appendChild(container);
        }

        // Create toast
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = `Theme changed to ${themeName}`;
        
        container.appendChild(toast);

        // Remove after delay
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }

    /**
     * Initialize theme system
     */
    initialize() {
        // Apply saved theme from store
        const savedTheme = window.store?.getState('theme') || 'winamp';
        this.applyTheme(savedTheme);

        // Set up keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 't') {
                e.preventDefault();
                this.nextTheme();
            }
        });

        // Set up theme buttons
        this.setupThemeButtons();
    }

    /**
     * Set up theme selection buttons
     */
    setupThemeButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('theme-btn')) {
                const theme = e.target.getAttribute('data-theme');
                if (theme) {
                    this.applyTheme(theme);
                    
                    // Update store
                    if (window.store) {
                        window.store.setTheme(theme);
                    }
                }
            }
        });
    }

    /**
     * Create dynamic theme based on colors
     */
    createCustomTheme(name, colors) {
        const style = document.createElement('style');
        style.id = `custom-theme-${name}`;
        
        let css = `.theme-${name} {\n`;
        Object.entries(colors).forEach(([key, value]) => {
            css += `  --color-${key}: ${value};\n`;
        });
        css += '}\n';
        
        style.textContent = css;
        document.head.appendChild(style);
        
        // Add to themes registry
        this.themes[name] = {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            description: 'Custom theme',
            effects: { scanlines: false, noise: false, glow: true }
        };
    }

    /**
     * Generate theme based on dominant colors from document
     */
    generateThemeFromDocument() {
        // This could analyze the document content and create a custom theme
        // For now, we'll create a simple health-themed variant
        const healthColors = {
            primary: '#2563eb',
            secondary: '#06b6d4',
            error: '#dc2626',
            success: '#059669',
            background: '#f8fafc',
            surface: '#ffffff',
            border: '#e5e7eb',
            'border-light': '#f3f4f6',
            'border-dark': '#d1d5db',
            button: '#f9fafb',
            'button-hover': '#f3f4f6',
            text: '#1f2937',
            'text-secondary': '#6b7280'
        };

        this.createCustomTheme('document', healthColors);
        return 'document';
    }

    /**
     * Export current theme configuration
     */
    exportTheme() {
        const currentConfig = this.getCurrentTheme();
        return JSON.stringify(currentConfig, null, 2);
    }

    /**
     * Import theme configuration
     */
    importTheme(themeData) {
        try {
            const parsed = typeof themeData === 'string' ? JSON.parse(themeData) : themeData;
            
            if (parsed.name && parsed.config) {
                this.themes[parsed.name] = parsed.config;
                return parsed.name;
            }
        } catch (error) {
            console.error('Failed to import theme:', error);
        }
        return null;
    }
}

// Create global theme manager
window.themeManager = new ThemeManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager.initialize();
    });
} else {
    window.themeManager.initialize();
}