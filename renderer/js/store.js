/**
 * Simple state management store
 */
class Store {
    constructor() {
        this.state = {
            document: null,
            fileName: null,
            loading: false,
            error: null,
            theme: 'winamp',
            activeTab: 'patient',
            panels: {
                visualizer: false,
                themes: true,
                export: true
            },
            settings: {
                animations: true,
                scanlines: false,
                noise: false
            }
        };

        this.subscribers = new Map();
        this.loadPersistedState();
    }

    /**
     * Subscribe to state changes
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(key);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    /**
     * Get current state value
     */
    getState(key = null) {
        if (key) {
            return this.state[key];
        }
        return { ...this.state };
    }

    /**
     * Set state value and notify subscribers
     */
    setState(updates) {
        const prevState = { ...this.state };
        
        // Apply updates
        if (typeof updates === 'function') {
            this.state = { ...this.state, ...updates(this.state) };
        } else {
            this.state = { ...this.state, ...updates };
        }

        // Notify subscribers of changes
        Object.keys(updates).forEach(key => {
            if (prevState[key] !== this.state[key]) {
                this.notifySubscribers(key, this.state[key], prevState[key]);
            }
        });

        // Persist certain state changes
        this.persistState();
    }

    /**
     * Notify subscribers of state changes
     */
    notifySubscribers(key, newValue, oldValue) {
        const callbacks = this.subscribers.get(key);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error('Error in state subscriber:', error);
                }
            });
        }

        // Global state change notification
        const globalCallbacks = this.subscribers.get('*');
        if (globalCallbacks) {
            globalCallbacks.forEach(callback => {
                try {
                    callback(key, newValue, oldValue);
                } catch (error) {
                    console.error('Error in global state subscriber:', error);
                }
            });
        }
    }

    /**
     * Actions for common state updates
     */
    setDocument(document) {
        this.setState({ 
            document,
            error: null,
            loading: false
        });
    }

    setFileName(fileName) {
        this.setState({ fileName });
    }

    setLoading(loading) {
        this.setState({ loading });
    }

    setError(error) {
        this.setState({ 
            error,
            loading: false
        });
    }

    setTheme(theme) {
        this.setState({ theme });
        
        // Apply theme to document
        if (document.body) {
            document.body.className = document.body.className.replace(/theme-\w+/, '');
            document.body.classList.add(`theme-${theme}`);
        }
    }

    setActiveTab(activeTab) {
        this.setState({ activeTab });
    }

    togglePanel(panelName) {
        this.setState({
            panels: {
                ...this.state.panels,
                [panelName]: !this.state.panels[panelName]
            }
        });
    }

    updateSettings(settings) {
        this.setState({
            settings: {
                ...this.state.settings,
                ...settings
            }
        });
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this.setState({
            document: null,
            fileName: null,
            loading: false,
            error: null,
            activeTab: 'patient'
        });
    }

    /**
     * Load persisted state from localStorage
     */
    loadPersistedState() {
        try {
            const saved = localStorage.getItem('ccd-viewer-state');
            if (saved) {
                const parsed = JSON.parse(saved);
                
                // Only restore certain keys
                const restoreKeys = ['theme', 'panels', 'settings'];
                const toRestore = {};
                
                restoreKeys.forEach(key => {
                    if (parsed[key] !== undefined) {
                        toRestore[key] = parsed[key];
                    }
                });

                this.state = { ...this.state, ...toRestore };

                // Apply theme immediately
                if (toRestore.theme && document.body) {
                    document.body.className = document.body.className.replace(/theme-\w+/, '');
                    document.body.classList.add(`theme-${toRestore.theme}`);
                }
            }
        } catch (error) {
            console.warn('Failed to load persisted state:', error);
        }
    }

    /**
     * Persist certain state to localStorage
     */
    persistState() {
        try {
            const toPersist = {
                theme: this.state.theme,
                panels: this.state.panels,
                settings: this.state.settings
            };
            
            localStorage.setItem('ccd-viewer-state', JSON.stringify(toPersist));
        } catch (error) {
            console.warn('Failed to persist state:', error);
        }
    }

    /**
     * Get formatted patient info
     */
    getPatientInfo() {
        const patient = this.state.document?.patient;
        if (!patient) return null;

        return {
            name: patient.name?.full || 'Unknown Patient',
            id: patient.id || patient.mrn || 'Unknown',
            dateOfBirth: this.formatDate(patient.dateOfBirth),
            gender: patient.gender || 'Unknown',
            age: this.calculateAge(patient.dateOfBirth)
        };
    }

    /**
     * Get document summary stats
     */
    getDocumentStats() {
        const doc = this.state.document;
        if (!doc) return null;

        return {
            allergies: doc.allergies?.length || 0,
            medications: doc.medications?.length || 0,
            problems: doc.problems?.length || 0,
            procedures: doc.procedures?.length || 0,
            encounters: doc.encounters?.length || 0,
            immunizations: doc.immunizations?.length || 0,
            labResults: doc.labResults?.length || 0,
            vitalSigns: doc.vitalSigns?.length || 0
        };
    }

    /**
     * Helper methods
     */
    formatDate(dateString) {
        if (!dateString) return null;
        
        try {
            // Handle CCDA date format (YYYYMMDD or YYYYMMDDHHMMSS)
            let dateStr = dateString.toString();
            if (dateStr.length >= 8) {
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                
                const date = new Date(`${year}-${month}-${day}`);
                return date.toLocaleDateString();
            }
            
            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            return dateString;
        }
    }

    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return null;
        
        try {
            const birthDate = new Date(this.formatDate(dateOfBirth));
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                return age - 1;
            }
            
            return age;
        } catch (error) {
            return null;
        }
    }

    /**
     * Export document data in various formats
     */
    exportAsJSON() {
        if (!this.state.document) return null;
        
        return JSON.stringify(this.state.document, null, 2);
    }

    exportAsCSV() {
        if (!this.state.document) return null;
        
        const doc = this.state.document;
        const patient = this.getPatientInfo();
        
        let csv = 'Section,Field,Value\n';
        
        // Patient info
        if (patient) {
            csv += `Patient,Name,"${patient.name}"\n`;
            csv += `Patient,ID,"${patient.id}"\n`;
            csv += `Patient,Date of Birth,"${patient.dateOfBirth}"\n`;
            csv += `Patient,Gender,"${patient.gender}"\n`;
            csv += `Patient,Age,"${patient.age}"\n`;
        }

        // Add other sections
        ['allergies', 'medications', 'problems', 'procedures'].forEach(section => {
            const items = doc[section] || [];
            items.forEach((item, index) => {
                Object.keys(item).forEach(key => {
                    if (typeof item[key] === 'string' || typeof item[key] === 'number') {
                        csv += `${section},${key},"${item[key]}"\n`;
                    }
                });
            });
        });

        return csv;
    }
}

// Create global store instance
window.store = new Store();