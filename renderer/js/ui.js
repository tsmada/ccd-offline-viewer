/**
 * UI Management and Components
 */
class UIManager {
    constructor() {
        this.currentView = 'empty';
        this.activeTab = 'patient';
        this.tabs = [
            { id: 'patient', label: 'Patient Info', icon: '👤' },
            { id: 'allergies', label: 'Allergies', icon: '⚠️' },
            { id: 'medications', label: 'Medications', icon: '💊' },
            { id: 'problems', label: 'Problems', icon: '🔍' },
            { id: 'procedures', label: 'Procedures', icon: '🏥' },
            { id: 'encounters', label: 'Encounters', icon: '📋' },
            { id: 'vitals', label: 'Vital Signs', icon: '📊' },
            { id: 'labs', label: 'Lab Results', icon: '🧪' }
        ];
    }

    /**
     * Initialize UI components and event listeners
     */
    initialize() {
        this.setupEventListeners();
        this.setupAnimations();
        this.updateUI();

        // Subscribe to store changes
        if (window.store) {
            window.store.subscribe('document', (document) => {
                this.onDocumentChange(document);
            });

            window.store.subscribe('loading', (loading) => {
                this.setLoadingState(loading);
            });

            window.store.subscribe('error', (error) => {
                this.showError(error);
            });

            window.store.subscribe('activeTab', (tab) => {
                this.setActiveTab(tab);
            });

            window.store.subscribe('fileName', () => {
                this.updateUI();
            });
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // Browse files button
        const browseBtn = document.getElementById('browse-files');
        if (browseBtn) {
            browseBtn.addEventListener('click', () => {
                fileInput?.click();
            });
        }

        // Load sample button
        const sampleBtn = document.getElementById('load-sample');
        if (sampleBtn) {
            sampleBtn.addEventListener('click', this.loadSampleDocument.bind(this));
        }

        // Tab buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                const tabId = e.target.getAttribute('data-tab');
                this.setActiveTab(tabId);
            }
        });

        // Export buttons
        document.getElementById('export-pdf')?.addEventListener('click', this.exportToPDF.bind(this));
        document.getElementById('export-json')?.addEventListener('click', this.exportToJSON.bind(this));
        document.getElementById('export-csv')?.addEventListener('click', this.exportToCSV.bind(this));

        // Header buttons
        document.getElementById('toggle-visualizer')?.addEventListener('click', this.toggleVisualizer.bind(this));
        document.getElementById('settings-btn')?.addEventListener('click', this.showSettings.bind(this));
        document.getElementById('close-btn')?.addEventListener('click', this.closeApp.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeydown.bind(this));

        // Drag and drop
        this.setupDragAndDrop();
    }

    /**
     * Set up drag and drop functionality
     */
    setupDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults.bind(this), false);
            document.body.addEventListener(eventName, this.preventDefaults.bind(this), false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.highlight.bind(this), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.unhighlight.bind(this), false);
        });

        dropZone.addEventListener('drop', this.handleDrop.bind(this), false);
    }

    /**
     * Prevent default drag behaviors
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Highlight drop zone
     */
    highlight(e) {
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.classList.add('drag-over');
        }
    }

    /**
     * Remove highlight from drop zone
     */
    unhighlight(e) {
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.classList.remove('drag-over');
        }
    }

    /**
     * Handle dropped files
     */
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        this.handleFiles(files);
    }

    /**
     * Handle file selection
     */
    handleFileSelect(e) {
        const files = e.target.files;
        this.handleFiles(files);
    }

    /**
     * Process selected/dropped files
     */
    handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        
        // Validate file type
        const validExtensions = ['.xml', '.ccd', '.cda'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validExtensions.includes(fileExtension)) {
            this.showError('Please select a valid CCD/CDA file (.xml, .ccd, .cda)');
            return;
        }

        // Load the file
        this.loadFile(file);
    }

    /**
     * Load and parse a CCD file
     */
    async loadFile(file) {
        if (!window.store || !window.CCDParser) {
            this.showError('Application not properly initialized');
            return;
        }

        try {
            window.store.setLoading(true);
            window.store.setFileName(file.name);
            window.store.setError(null);

            // Read file content
            const content = await this.readFileAsText(file);
            
            // Parse CCD
            const parser = new window.CCDParser();
            const ccdDocument = await parser.parse(content);
            
            // Update store
            window.store.setDocument(ccdDocument);
            
            // Show success message
            this.showToast('Document loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to load file:', error);
            this.showError(error.message || 'Failed to load document');
        }
    }

    /**
     * Read file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Load sample document
     */
    async loadSampleDocument() {
        // Create a minimal sample CCD document
        const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3">
    <id root="1.2.3.4.5.6.7.8.9" />
    <title>Sample CCD Document</title>
    <effectiveTime value="20240101120000" />
    <confidentialityCode code="N" />
    <languageCode code="en-US" />
    
    <recordTarget>
        <patientRole>
            <id root="1.2.3.4" extension="12345" />
            <patient>
                <name>
                    <given>John</given>
                    <family>Doe</family>
                </name>
                <administrativeGenderCode code="M" displayName="Male" />
                <birthTime value="19800101" />
            </patient>
        </patientRole>
    </recordTarget>
    
    <component>
        <structuredBody>
            <component>
                <section>
                    <templateId root="2.16.840.1.113883.10.20.22.2.6.1" />
                    <title>Allergies</title>
                    <text>No known allergies</text>
                </section>
            </component>
        </structuredBody>
    </component>
</ClinicalDocument>`;

        try {
            window.store.setLoading(true);
            window.store.setFileName('sample-ccd.xml');
            
            const parser = new window.CCDParser();
            const ccdDocument = await parser.parse(sampleXML);
            
            window.store.setDocument(ccdDocument);
            this.showToast('Sample document loaded!', 'success');
            
        } catch (error) {
            console.error('Failed to load sample:', error);
            this.showError('Failed to load sample document');
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeydown(e) {
        // Cmd/Ctrl + O - Open file
        if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
            e.preventDefault();
            document.getElementById('file-input')?.click();
        }
        
        // Cmd/Ctrl + S - Save/Export
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            this.exportToPDF();
        }
        
        // Cmd/Ctrl + E - Export menu
        if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
            e.preventDefault();
            this.showExportMenu();
        }
    }

    /**
     * Update UI based on current state
     */
    updateUI() {
        const state = window.store?.getState();
        if (!state) return;

        // Update status
        const status = document.getElementById('status');
        if (status) {
            if (state.document) {
                const patient = state.document.patient;
                const name = patient?.name?.full || 'Unknown Patient';
                status.textContent = `${name} - ${state.fileName || 'Document'}`;
            } else {
                status.textContent = 'NO FILE LOADED';
            }
        }

        // Show appropriate view
        if (state.loading) {
            this.showView('loading');
        } else if (state.error) {
            this.showError(state.error);
        } else if (state.document) {
            this.showView('document');
            this.renderTabs();
            this.renderTabContent();
        } else {
            this.showView('empty');
        }
    }

    /**
     * Show specific view
     */
    showView(viewName) {
        const views = ['empty-state', 'document-view', 'loading-screen'];
        
        views.forEach(view => {
            const element = document.getElementById(view);
            if (element) {
                if (view === `${viewName}-${view.includes('state') ? 'state' : view.includes('view') ? 'view' : 'screen'}`) {
                    element.classList.remove('hidden');
                } else {
                    element.classList.add('hidden');
                }
            }
        });

        this.currentView = viewName;
    }

    /**
     * Set loading state
     */
    setLoadingState(loading) {
        if (loading) {
            this.showView('loading');
        } else {
            this.updateUI();
        }
    }

    /**
     * Handle document change
     */
    onDocumentChange(document) {
        if (document) {
            this.showView('document');
            this.renderTabs();
            this.renderTabContent();
        } else {
            this.showView('empty');
        }
        
        // Update UI including status bar
        this.updateUI();
    }

    /**
     * Render document tabs
     */
    renderTabs() {
        const tabButtons = document.getElementById('tab-buttons');
        if (!tabButtons) return;

        const ccdDocument = window.store?.getState('document');
        if (!ccdDocument) return;

        tabButtons.innerHTML = '';

        this.tabs.forEach(tab => {
            // Check if tab has data
            const hasData = this.hasTabData(tab.id, ccdDocument);
            
            const button = document.createElement('button');
            button.className = `tab-button winamp-button px-3 py-2 text-sm ${this.activeTab === tab.id ? 'active' : ''}`;
            button.setAttribute('data-tab', tab.id);
            button.innerHTML = `${tab.icon} ${tab.label}`;
            
            if (!hasData) {
                button.style.opacity = '0.5';
                button.title = 'No data available';
            }

            tabButtons.appendChild(button);
        });
    }

    /**
     * Check if tab has data
     */
    hasTabData(tabId, document) {
        switch (tabId) {
            case 'patient': return !!document.patient;
            case 'allergies': return document.allergies?.length > 0;
            case 'medications': return document.medications?.length > 0;
            case 'problems': return document.problems?.length > 0;
            case 'procedures': return document.procedures?.length > 0;
            case 'encounters': return document.encounters?.length > 0;
            case 'vitals': return document.vitalSigns?.length > 0;
            case 'labs': return document.labResults?.length > 0;
            default: return false;
        }
    }

    /**
     * Set active tab
     */
    setActiveTab(tabId) {
        if (!tabId) return;

        this.activeTab = tabId;
        
        // Update button states
        document.querySelectorAll('.tab-button').forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Render content
        this.renderTabContent();

        // Update store
        if (window.store) {
            window.store.setActiveTab(tabId);
        }
    }

    /**
     * Render tab content
     */
    renderTabContent() {
        const contentElement = document.getElementById('tab-content');
        if (!contentElement) return;

        const ccdDocument = window.store?.getState('document');
        if (!ccdDocument) {
            contentElement.innerHTML = '<p class="text-text-secondary">No document loaded</p>';
            return;
        }

        let content = '';

        switch (this.activeTab) {
            case 'patient':
                content = this.renderPatientContent(ccdDocument.patient);
                break;
            case 'allergies':
                content = this.renderAllergiesContent(ccdDocument.allergies || []);
                break;
            case 'medications':
                content = this.renderMedicationsContent(ccdDocument.medications || []);
                break;
            case 'problems':
                content = this.renderProblemsContent(ccdDocument.problems || []);
                break;
            case 'procedures':
                content = this.renderProceduresContent(ccdDocument.procedures || []);
                break;
            case 'encounters':
                content = this.renderEncountersContent(ccdDocument.encounters || []);
                break;
            case 'vitals':
                content = this.renderVitalsContent(ccdDocument.vitalSigns || []);
                break;
            case 'labs':
                content = this.renderLabsContent(ccdDocument.labResults || []);
                break;
            default:
                content = '<p class="text-text-secondary">Tab content not implemented</p>';
        }

        contentElement.innerHTML = content;
    }

    /**
     * Render patient information
     */
    renderPatientContent(patient) {
        if (!patient) {
            return '<p class="text-text-secondary">No patient information available</p>';
        }

        const patientInfo = window.store?.getPatientInfo();

        return `
            <div class="document-section">
                <h3>Patient Information</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <strong>Name:</strong> ${patientInfo?.name || 'Unknown'}
                    </div>
                    <div>
                        <strong>ID:</strong> ${patientInfo?.id || 'Unknown'}
                    </div>
                    <div>
                        <strong>Date of Birth:</strong> ${patientInfo?.dateOfBirth || 'Unknown'}
                    </div>
                    <div>
                        <strong>Age:</strong> ${patientInfo?.age || 'Unknown'}
                    </div>
                    <div>
                        <strong>Gender:</strong> ${patientInfo?.gender || 'Unknown'}
                    </div>
                    <div>
                        <strong>Race:</strong> ${patient.race || 'Not specified'}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render allergies content
     */
    renderAllergiesContent(allergies) {
        if (allergies.length === 0) {
            return '<p class="text-text-secondary">No allergies recorded</p>';
        }

        const rows = allergies.map(allergy => `
            <tr>
                <td>${allergy.substance || 'Unknown'}</td>
                <td>${allergy.reaction || 'Not specified'}</td>
                <td>${allergy.severity || 'Not specified'}</td>
                <td>${allergy.status || 'Unknown'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Allergies</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Substance</th>
                            <th>Reaction</th>
                            <th>Severity</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render medications content
     */
    renderMedicationsContent(medications) {
        if (medications.length === 0) {
            return '<p class="text-text-secondary">No medications recorded</p>';
        }

        const rows = medications.map(med => `
            <tr>
                <td>${med.name || 'Unknown'}</td>
                <td>${med.dosage || 'Not specified'}</td>
                <td>${med.frequency || 'Not specified'}</td>
                <td>${med.route || 'Not specified'}</td>
                <td>${med.status || 'Unknown'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Medications</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Medication</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Route</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render problems content
     */
    renderProblemsContent(problems) {
        if (problems.length === 0) {
            return '<p class="text-text-secondary">No problems recorded</p>';
        }

        const rows = problems.map(problem => `
            <tr>
                <td>${problem.problem || 'Unknown'}</td>
                <td>${problem.status || 'Unknown'}</td>
                <td>${problem.onsetDate ? window.store.formatDate(problem.onsetDate) : 'Not specified'}</td>
                <td>${problem.severity || 'Not specified'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Problems</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Problem</th>
                            <th>Status</th>
                            <th>Onset Date</th>
                            <th>Severity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render procedures content
     */
    renderProceduresContent(procedures) {
        if (procedures.length === 0) {
            return '<p class="text-text-secondary">No procedures recorded</p>';
        }

        const rows = procedures.map(proc => `
            <tr>
                <td>${proc.name || 'Unknown'}</td>
                <td>${proc.date ? window.store.formatDate(proc.date) : 'Not specified'}</td>
                <td>${proc.performer || 'Not specified'}</td>
                <td>${proc.status || 'Unknown'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Procedures</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Procedure</th>
                            <th>Date</th>
                            <th>Performer</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render encounters content
     */
    renderEncountersContent(encounters) {
        if (encounters.length === 0) {
            return '<p class="text-text-secondary">No encounters recorded</p>';
        }

        const rows = encounters.map(enc => `
            <tr>
                <td>${enc.type || 'Unknown'}</td>
                <td>${enc.date ? window.store.formatDate(enc.date) : 'Not specified'}</td>
                <td>${enc.provider || 'Not specified'}</td>
                <td>${enc.location || 'Not specified'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Encounters</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Provider</th>
                            <th>Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render vital signs content
     */
    renderVitalsContent(vitals) {
        if (vitals.length === 0) {
            return '<p class="text-text-secondary">No vital signs recorded</p>';
        }

        const rows = vitals.map(vital => `
            <tr>
                <td>${vital.date ? window.store.formatDate(vital.date) : 'Not specified'}</td>
                <td>${vital.systolicBP ? `${vital.systolicBP.value} ${vital.systolicBP.unit}` : '-'}</td>
                <td>${vital.diastolicBP ? `${vital.diastolicBP.value} ${vital.diastolicBP.unit}` : '-'}</td>
                <td>${vital.heartRate ? `${vital.heartRate.value} ${vital.heartRate.unit}` : '-'}</td>
                <td>${vital.temperature ? `${vital.temperature.value} ${vital.temperature.unit}` : '-'}</td>
                <td>${vital.weight ? `${vital.weight.value} ${vital.weight.unit}` : '-'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Vital Signs</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Systolic BP</th>
                            <th>Diastolic BP</th>
                            <th>Heart Rate</th>
                            <th>Temperature</th>
                            <th>Weight</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render lab results content
     */
    renderLabsContent(labs) {
        if (labs.length === 0) {
            return '<p class="text-text-secondary">No lab results recorded</p>';
        }

        return `
            <div class="document-section">
                <h3>Lab Results</h3>
                ${labs.map(lab => `
                    <div class="mb-4">
                        <h4>${lab.panel || 'Lab Panel'} - ${lab.date ? window.store.formatDate(lab.date) : 'Date unknown'}</h4>
                        <table class="document-table">
                            <thead>
                                <tr>
                                    <th>Test</th>
                                    <th>Value</th>
                                    <th>Unit</th>
                                    <th>Reference Range</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${lab.results?.map(result => `
                                    <tr>
                                        <td>${result.test || 'Unknown'}</td>
                                        <td>${result.value || 'N/A'}</td>
                                        <td>${result.unit || ''}</td>
                                        <td>${result.referenceRange || 'Not provided'}</td>
                                    </tr>
                                `).join('') || '<tr><td colspan="4">No results available</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Export functions
     */
    async exportToPDF() {
        if (window.app) {
            await window.app.exportDocument('pdf');
        } else {
            this.showToast('PDF export requires Electron', 'error');
        }
    }

    async exportToJSON() {
        const jsonData = window.store?.exportAsJSON();
        if (jsonData) {
            this.downloadFile(jsonData, 'ccd-document.json', 'application/json');
        }
    }

    async exportToCSV() {
        const csvData = window.store?.exportAsCSV();
        if (csvData) {
            this.downloadFile(csvData, 'ccd-document.csv', 'text/csv');
        }
    }

    /**
     * Download file helper
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        this.showToast(`Exported ${filename}`, 'success');
    }

    /**
     * UI helper functions
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info', duration = 3000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-4 right-4 z-50';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);

        // Remove after delay
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    }

    toggleVisualizer() {
        // Placeholder for visualizer toggle
        this.showToast('Visualizer toggle not yet implemented', 'info');
    }

    showSettings() {
        // Placeholder for settings dialog
        this.showToast('Settings dialog not yet implemented', 'info');
    }

    showExportMenu() {
        // Placeholder for export menu
        this.showToast('Export menu - use individual export buttons', 'info');
    }

    closeApp() {
        if (window.electronAPI) {
            // Close via Electron API
            window.close();
        } else {
            this.showToast('Close functionality only available in Electron', 'info');
        }
    }

    /**
     * Set up animations
     */
    setupAnimations() {
        // Add CSS classes for animations when elements come into view
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements that should animate in
        document.querySelectorAll('.fade-in, .slide-up, .scale-up').forEach(el => {
            observer.observe(el);
        });
    }
}

// Create global UI manager
window.uiManager = new UIManager();