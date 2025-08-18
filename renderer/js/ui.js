/**
 * UI Management and Components
 */
class UIManager {
    constructor() {
        this.currentView = 'empty';
        this.activeTab = 'patient';
        this.documentType = null;
        this.sectionRegistry = null;
        this.documentRenderer = null;
        // Initialize dependencies lazily
    }

    /**
     * Initialize dependencies lazily
     */
    initializeDependencies() {
        try {
            if (window.SectionRegistry) {
                this.sectionRegistry = new window.SectionRegistry();
            }
            if (window.DocumentRenderer) {
                this.documentRenderer = new window.DocumentRenderer();
            }
        } catch (error) {
            console.warn('Some dependencies not available yet, will use fallbacks:', error);
        }
    }

    /**
     * Initialize UI components and event listeners
     */
    initialize() {
        this.initializeDependencies();
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
            
            // Store raw XML content
            window.store.setRawXML(content);
            
            // Parse CCD/CCDA document
            console.log('CCDAParser available:', !!window.CCDAParser);
            console.log('Using parser:', window.CCDAParser ? 'CCDAParser' : 'CCDParser');
            const parser = window.CCDAParser ? new window.CCDAParser() : new window.CCDParser();
            const ccdDocument = await parser.parse(content);
            console.log('Parsed document type:', ccdDocument.metadata?.documentType || 'unknown');
            
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
            
            const parser = window.CCDAParser ? new window.CCDAParser() : new window.CCDParser();
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

        // Cmd/Ctrl + F - Find in raw XML view
        if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
            // Only show find if we're in the raw XML tab
            if (this.activeTab === 'rawXML') {
                e.preventDefault();
                const findControls = document.getElementById('xml-find-controls');
                if (findControls && this.showXMLFind) {
                    this.showXMLFind();
                }
            }
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
            this.documentType = document.metadata?.documentType || 'ccd';
            this.generateDynamicTabs();
            this.showView('document');
            this.renderTabs();
            this.renderTabContent();
        } else {
            this.documentType = null;
            this.showView('empty');
        }
        
        // Update UI including status bar
        this.updateUI();
    }

    /**
     * Generate dynamic tabs based on document type
     */
    generateDynamicTabs() {
        if (!this.documentType) return;

        // Initialize dependencies if not already done
        if (!this.sectionRegistry) {
            this.initializeDependencies();
        }

        if (this.sectionRegistry) {
            this.supportedSections = this.sectionRegistry.getSupportedSections(this.documentType);
            console.log(`Generated ${this.supportedSections.length} tabs for document type: ${this.documentType}`);
        } else {
            // Fallback to basic sections if registry not available
            this.supportedSections = this.getBasicSections();
            console.warn('Section registry not available, using basic sections');
        }
    }

    /**
     * Get basic sections as fallback
     */
    getBasicSections() {
        return [
            { id: 'header', label: 'Document Info', icon: '📄', required: true },
            { id: 'patient', label: 'Patient Info', icon: '👤', required: true },
            { id: 'allergies', label: 'Allergies', icon: '⚠️', required: false },
            { id: 'medications', label: 'Medications', icon: '💊', required: false },
            { id: 'problems', label: 'Problems', icon: '🔍', required: false },
            { id: 'procedures', label: 'Procedures', icon: '🏥', required: false },
            { id: 'vitals', label: 'Vital Signs', icon: '📊', required: false },
            { id: 'labs', label: 'Lab Results', icon: '🧪', required: false }
        ];
    }

    /**
     * Render document tabs
     */
    renderTabs() {
        const tabButtons = document.getElementById('tab-buttons');
        if (!tabButtons) return;

        const ccdDocument = window.store?.getState('document');
        if (!ccdDocument || !this.supportedSections) return;

        tabButtons.innerHTML = '';

        this.supportedSections.forEach(section => {
            // Check if section has data
            const hasData = this.hasTabData(section.id, ccdDocument);
            
            const button = this.createTabButton(section, hasData);
            tabButtons.appendChild(button);
        });
    }

    /**
     * Create a tab button for a section
     */
    createTabButton(section, hasData) {
        const button = document.createElement('button');
        button.className = `tab-button winamp-button px-3 py-2 text-sm ${this.activeTab === section.id ? 'active' : ''}`;
        button.setAttribute('data-tab', section.id);
        button.innerHTML = `${section.icon} ${section.label}`;
        
        if (section.required) {
            button.classList.add('required-section');
        }
        
        if (!hasData) {
            button.style.opacity = '0.5';
            button.title = 'No data available';
        } else if (section.required) {
            button.title = 'Required section';
        }

        return button;
    }

    /**
     * Check if tab has data
     */
    hasTabData(tabId, document) {
        switch (tabId) {
            case 'header': return !!document.header;
            case 'patient': return !!document.patient;
            case 'allergies': return document.allergies?.length > 0;
            case 'medications': return document.medications?.length > 0;
            case 'problems': return document.problems?.length > 0;
            case 'procedures': return document.procedures?.length > 0;
            case 'encounters': return document.encounters?.length > 0;
            case 'immunizations': return document.immunizations?.length > 0;
            case 'vitals': return document.vitals?.length > 0 || document.vitalSigns?.length > 0;
            case 'labs': return document.labs?.length > 0 || document.labResults?.length > 0;
            case 'results': return document.results?.length > 0 || document.labResults?.length > 0;
            case 'socialHistory': return document.socialHistory?.length > 0;
            case 'functionalStatus': return document.functionalStatus?.length > 0;
            case 'planOfCare': return document.planOfCare?.length > 0;
            case 'notes': return document.notes?.length > 0;
            case 'advanceDirectives': return document.advanceDirectives?.length > 0;
            case 'assessment': return !!document.assessment && (Array.isArray(document.assessment) ? document.assessment.length > 0 : !!document.assessment.text);
            case 'chiefComplaint': return !!document.chiefComplaint && (Array.isArray(document.chiefComplaint) ? document.chiefComplaint.length > 0 : !!(document.chiefComplaint.text || document.chiefComplaint.structuredText?.length));
            case 'familyHistory': return !!document.familyHistory && (Array.isArray(document.familyHistory) ? document.familyHistory.length > 0 : !!document.familyHistory.text);
            case 'goals': return !!document.goals && (Array.isArray(document.goals) ? document.goals.length > 0 : !!document.goals.text);
            case 'healthConcerns': return !!document.healthConcerns && (Array.isArray(document.healthConcerns) ? document.healthConcerns.length > 0 : !!document.healthConcerns.text);
            case 'instructions': return !!document.instructions && (Array.isArray(document.instructions) ? document.instructions.length > 0 : !!document.instructions.text);
            case 'medicalEquipment': return !!document.medicalEquipment && (Array.isArray(document.medicalEquipment) ? document.medicalEquipment.length > 0 : !!document.medicalEquipment.text);
            case 'mentalStatus': return !!document.mentalStatus && (Array.isArray(document.mentalStatus) ? document.mentalStatus.length > 0 : !!document.mentalStatus.text);
            case 'nutrition': return !!document.nutrition && (Array.isArray(document.nutrition) ? document.nutrition.length > 0 : !!document.nutrition.text);
            case 'payers': return !!document.payers && (Array.isArray(document.payers) ? document.payers.length > 0 : !!document.payers.text);
            case 'physicalExam': return !!document.physicalExam && (Array.isArray(document.physicalExam) ? document.physicalExam.length > 0 : !!document.physicalExam.text);
            case 'reasonForVisit': return !!document.reasonForVisit && (Array.isArray(document.reasonForVisit) ? document.reasonForVisit.length > 0 : !!document.reasonForVisit.text);
            case 'reviewOfSystems': return !!document.reviewOfSystems && (Array.isArray(document.reviewOfSystems) ? document.reviewOfSystems.length > 0 : !!document.reviewOfSystems.text);
            case 'subjectiveData': return !!document.subjectiveData && (Array.isArray(document.subjectiveData) ? document.subjectiveData.length > 0 : !!document.subjectiveData.text);
            case 'objectiveData': return !!document.objectiveData && (Array.isArray(document.objectiveData) ? document.objectiveData.length > 0 : !!document.objectiveData.text);
            case 'planOfTreatment': return !!document.planOfTreatment && (Array.isArray(document.planOfTreatment) ? document.planOfTreatment.length > 0 : !!document.planOfTreatment.text);
            case 'rawXML': return !!window.store?.getState('rawXML');
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
        
        // Use dynamic rendering based on section
        let sectionData = ccdDocument[this.activeTab];
        
        // Debug specific tabs
        if (['allergies', 'medications', 'labs', 'vitals'].includes(this.activeTab)) {
            console.log(`=== UI Rendering ${this.activeTab} ===`);
            console.log('Available document keys:', Object.keys(ccdDocument));
            console.log(`ccdDocument.${this.activeTab}:`, ccdDocument[this.activeTab]);
            console.log('sectionData:', sectionData);
        }
        
        // Handle field name mismatches between parser and UI
        if (this.activeTab === 'labs' && !sectionData && ccdDocument.labResults) {
            sectionData = ccdDocument.labResults;
        }
        if (this.activeTab === 'vitals' && !sectionData && ccdDocument.vitalSigns) {
            sectionData = ccdDocument.vitalSigns;
        }
        if (this.activeTab === 'results' && !sectionData && ccdDocument.labResults) {
            sectionData = ccdDocument.labResults;
        }
        let content = '';

        // Special handling for specific sections
        if (this.activeTab === 'header') {
            content = this.renderHeaderContent(ccdDocument.header, ccdDocument.sectionMetadata);
        } else if (this.activeTab === 'patient') {
            content = this.renderPatientContent(ccdDocument.patient);
        } else if (this.activeTab === 'rawXML') {
            content = this.renderRawXMLContent(ccdDocument.raw);
        } else {
            // For standard clinical sections, use legacy renderers directly
            const standardSections = ['allergies', 'medications', 'problems', 'procedures', 'encounters', 'immunizations', 'vitals', 'labs', 'results', 'socialHistory', 'functionalStatus', 'planOfCare', 'notes', 'advanceDirectives'];
            
            console.log(`=== ROUTING CHECK: ${this.activeTab} in standardSections? ${standardSections.includes(this.activeTab)} ===`);
            
            if (standardSections.includes(this.activeTab)) {
                console.log(`=== USING LEGACY RENDERER FOR STANDARD SECTION ${this.activeTab} ===`);
                content = this.renderLegacySection(this.activeTab, sectionData, ccdDocument);
            } else {
                // Use document renderer for dynamic sections
                try {
                    if (!this.documentRenderer) {
                        this.initializeDependencies();
                    }

                    if (this.documentRenderer) {
                        console.log(`=== Using DocumentRenderer for ${this.activeTab} ===`);
                        content = this.documentRenderer.renderSection(
                            this.activeTab, 
                            sectionData, 
                            this.documentType
                        );
                        console.log('DocumentRenderer result:', content);
                    } else {
                        console.log(`=== Using legacy renderer for ${this.activeTab} ===`);
                        // Fallback to legacy rendering methods
                        content = this.renderLegacySection(this.activeTab, sectionData, ccdDocument);
                    }
                } catch (error) {
                    console.warn(`Error rendering section ${this.activeTab}:`, error);
                    console.log(`=== Falling back to legacy renderer for ${this.activeTab} ===`);
                    // Fallback to legacy rendering methods
                    content = this.renderLegacySection(this.activeTab, sectionData, ccdDocument);
                }
            }
        }

        contentElement.innerHTML = content;
        
        // Set up event listeners for dynamically created buttons in raw XML tab
        if (this.activeTab === 'rawXML') {
            this.setupRawXMLTabEvents();
        }
    }

    /**
     * Render patient information
     */
    renderPatientContent(patient) {
        if (!patient) {
            return '<p class="text-text-secondary">No patient information available</p>';
        }

        const patientInfo = window.store?.getPatientInfo();

        // Render all patient IDs
        const idsSection = patient.ids && patient.ids.length > 0 ? `
            <div class="document-section">
                <h4>Patient Identifiers</h4>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Value</th>
                            <th>Root</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${patient.ids.map(id => `
                            <tr>
                                <td>${id.type || 'Unknown'}</td>
                                <td>${id.extension || 'Not specified'}</td>
                                <td>${id.root || 'Not specified'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : '';

        // Render addresses
        const addressesSection = patient.addresses && patient.addresses.length > 0 ? `
            <div class="document-section">
                <h4>Addresses</h4>
                ${patient.addresses.map(addr => `
                    <div class="mb-2">
                        <strong>${addr.use || 'Address'}:</strong><br>
                        ${addr.line || ''}<br>
                        ${addr.city || ''}, ${addr.state || ''} ${addr.postalCode || ''}<br>
                        ${addr.country || ''}
                    </div>
                `).join('')}
            </div>
        ` : '';

        // Render contact information
        const telecomSection = patient.telecom && patient.telecom.length > 0 ? `
            <div class="document-section">
                <h4>Contact Information</h4>
                ${patient.telecom.map(tel => `
                    <div>
                        <strong>${tel.use || 'Contact'}:</strong> ${tel.value || 'Not specified'}
                    </div>
                `).join('')}
            </div>
        ` : '';

        // Render guardian information
        const guardiansSection = patient.guardians && patient.guardians.length > 0 ? `
            <div class="document-section">
                <h4>Guardians</h4>
                ${patient.guardians.map(guardian => `
                    <div class="mb-2">
                        <strong>Name:</strong> ${guardian.name?.full || 'Unknown'}<br>
                        <strong>Relationship:</strong> ${guardian.relationship || 'Not specified'}<br>
                        ${guardian.address ? `<strong>Address:</strong> ${guardian.address.line || ''}, ${guardian.address.city || ''}, ${guardian.address.state || ''}` : ''}
                    </div>
                `).join('')}
            </div>
        ` : '';

        return `
            <div class="document-section">
                <h3>Patient Information</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <strong>Name:</strong> ${patient.name?.full || 'Unknown'}
                        ${patient.name?.prefix ? `<br><small>Prefix: ${patient.name.prefix}</small>` : ''}
                        ${patient.name?.suffix ? `<br><small>Suffix: ${patient.name.suffix}</small>` : ''}
                        ${patient.name?.use ? `<br><small>Use: ${patient.name.use}</small>` : ''}
                    </div>
                    <div>
                        <strong>Primary ID:</strong> ${patientInfo?.id || 'Unknown'}
                    </div>
                    <div>
                        <strong>Date of Birth:</strong> ${patientInfo?.dateOfBirth || 'Unknown'}
                    </div>
                    <div>
                        <strong>Age:</strong> ${patientInfo?.age || 'Unknown'}
                    </div>
                    <div>
                        <strong>Gender:</strong> ${patient.genderDisplay || patient.gender || 'Unknown'}
                    </div>
                    <div>
                        <strong>Race:</strong> ${patient.race || 'Not specified'}
                    </div>
                    <div>
                        <strong>Ethnicity:</strong> ${patient.ethnicity || 'Not specified'}
                    </div>
                    <div>
                        <strong>Marital Status:</strong> ${patient.maritalStatus || 'Not specified'}
                    </div>
                    <div>
                        <strong>Religious Affiliation:</strong> ${patient.religiousAffiliation || 'Not specified'}
                    </div>
                    <div>
                        <strong>Birthplace:</strong> ${patient.birthplace ? `${patient.birthplace.state || ''}, ${patient.birthplace.country || ''}` : 'Not specified'}
                    </div>
                    <div>
                        <strong>Language:</strong> ${patient.language || 'Not specified'}
                    </div>
                </div>
            </div>
            ${idsSection}
            ${addressesSection}
            ${telecomSection}
            ${guardiansSection}
        `;
    }

    /**
     * Render document header content
     */
    renderHeaderContent(header, sectionMetadata) {
        if (!header) {
            return '<p class="text-text-secondary">No document header available</p>';
        }

        // Template IDs section
        const templateIdsSection = header.templateIds && header.templateIds.length > 0 ? `
            <div class="document-section">
                <h4>Template IDs</h4>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Root</th>
                            <th>Extension</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${header.templateIds.map(template => `
                            <tr>
                                <td>${template.root || 'Not specified'}</td>
                                <td>${template.extension || 'Not specified'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : '';

        // Section narrative text section
        const narrativeSection = sectionMetadata && Object.keys(sectionMetadata).length > 0 ? `
            <div class="document-section">
                <h4>Section Narrative Text</h4>
                ${Object.entries(sectionMetadata).map(([sectionName, metadata]) => {
                    if (!metadata.narrativeText) return '';
                    return `
                        <div class="mb-4">
                            <h5>${metadata.title || sectionName}</h5>
                            <div class="bg-background border border-border rounded p-3">
                                <pre class="whitespace-pre-wrap text-sm">${metadata.narrativeText}</pre>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        ` : '';

        return `
            <div class="document-section">
                <h3>Document Information</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <strong>Document ID:</strong> ${header.id || 'Unknown'}
                        ${header.idExtension ? `<br><small>Extension: ${header.idExtension}</small>` : ''}
                    </div>
                    <div>
                        <strong>Title:</strong> ${header.title || 'Unknown'}
                    </div>
                    <div>
                        <strong>Effective Time:</strong> ${header.effectiveTime ? window.store.formatDate(header.effectiveTime) : 'Unknown'}
                    </div>
                    <div>
                        <strong>Confidentiality:</strong> ${header.confidentialityCode || 'Unknown'}
                    </div>
                    <div>
                        <strong>Language:</strong> ${header.languageCode || 'Unknown'}
                    </div>
                    <div>
                        <strong>Realm:</strong> ${header.realmCode || 'Unknown'}
                    </div>
                    <div>
                        <strong>Set ID:</strong> ${header.setId || 'Not specified'}
                    </div>
                    <div>
                        <strong>Version:</strong> ${header.versionNumber || 'Not specified'}
                    </div>
                </div>

                ${header.typeId ? `
                    <div class="mt-4">
                        <h4>Type ID</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div><strong>Root:</strong> ${header.typeId.root || 'Not specified'}</div>
                            <div><strong>Extension:</strong> ${header.typeId.extension || 'Not specified'}</div>
                        </div>
                    </div>
                ` : ''}

                ${header.documentCode ? `
                    <div class="mt-4">
                        <h4>Document Code</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div><strong>Code:</strong> ${header.documentCode.code || 'Not specified'}</div>
                            <div><strong>Display Name:</strong> ${header.documentCode.displayName || 'Not specified'}</div>
                            <div><strong>Code System:</strong> ${header.documentCode.codeSystem || 'Not specified'}</div>
                            <div><strong>Code System Name:</strong> ${header.documentCode.codeSystemName || 'Not specified'}</div>
                        </div>
                    </div>
                ` : ''}

                ${header.author ? `
                    <div class="mt-4">
                        <h4>Author</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div><strong>Name:</strong> ${header.author.name?.full || 'Unknown'}</div>
                            <div><strong>ID:</strong> ${header.author.id || 'Not specified'}</div>
                            <div><strong>Organization:</strong> ${header.author.organization?.name || 'Not specified'}</div>
                        </div>
                    </div>
                ` : ''}
            </div>
            ${templateIdsSection}
            ${narrativeSection}
        `;
    }

    /**
     * Render allergies content
     */
    renderAllergiesContent(allergies) {
        console.log('=== renderAllergiesContent called ===');
        console.log('allergies parameter:', allergies);
        console.log('allergies type:', typeof allergies);
        console.log('allergies length:', allergies?.length);
        console.log('allergies[0]:', allergies?.[0]);
        
        if (!allergies || allergies.length === 0) {
            return '<p class="text-text-secondary">No allergies recorded</p>';
        }

        const rows = allergies.filter(allergy => allergy).map(allergy => {
            return `
                <tr>
                    <td>${allergy.substance || 'Unknown'}</td>
                    <td>${Array.isArray(allergy.reaction) ? allergy.reaction.join(', ') : (allergy.reaction || 'Not specified')}</td>
                    <td>${Array.isArray(allergy.severity) ? allergy.severity.join(', ') : (allergy.severity || 'Not specified')}</td>
                    <td>${allergy.status || 'Unknown'}</td>
                    <td>${allergy.onsetDate ? window.store.formatDate(allergy.onsetDate) : 'Unknown'}</td>
                    <td>${allergy.id || 'Not specified'}</td>
                    <td>${allergy.effectiveTime?.value ? window.store.formatDate(allergy.effectiveTime.value) : (allergy.effectiveTime?.low ? window.store.formatDate(allergy.effectiveTime.low) : 'Not specified')}</td>
                </tr>
            `;
        }).join('');

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
                            <th>Onset Date</th>
                            <th>ID</th>
                            <th>Effective Time</th>
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
        // Debug logging removed for production
        
        if (!medications || medications.length === 0) {
            return '<p class="text-text-secondary">No medications recorded</p>';
        }

        const rows = medications.filter(med => med).map(med => {
            return `
                <tr>
                    <td>${med.name || 'Unknown'}</td>
                    <td>${med.dosage || 'Not specified'}</td>
                    <td>${med.frequency || 'Not specified'}</td>
                    <td>${med.route || 'Not specified'}</td>
                    <td>${med.status || 'Unknown'}</td>
                </tr>
            `;
        }).join('');

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
        // Debug logging removed for production
        
        if (!vitals || vitals.length === 0) {
            return '<p class="text-text-secondary">No vital signs recorded</p>';
        }

        const rows = vitals.filter(vital => vital).map(vital => {
            return `
            <tr>
                <td>${vital.date ? window.store.formatDate(vital.date) : 'Not specified'}</td>
                <td>${vital.systolicBP ? `${vital.systolicBP.value} ${vital.systolicBP.unit}` : '-'}</td>
                <td>${vital.diastolicBP ? `${vital.diastolicBP.value} ${vital.diastolicBP.unit}` : '-'}</td>
                <td>${vital.heartRate ? `${vital.heartRate.value} ${vital.heartRate.unit}` : '-'}</td>
                <td>${vital.temperature ? `${vital.temperature.value} ${vital.temperature.unit}` : '-'}</td>
                <td>${vital.weight ? `${vital.weight.value} ${vital.weight.unit}` : '-'}</td>
            </tr>
            `;
        }).join('');

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
        // Debug logging removed for production
        
        if (!labs || labs.length === 0) {
            return '<p class="text-text-secondary">No lab results recorded</p>';
        }

        return `
            <div class="document-section">
                <h3>Lab Results</h3>
                ${labs.filter(lab => lab).map(lab => {
                    return `
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
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render immunizations content
     */
    renderImmunizationsContent(immunizations) {
        if (immunizations.length === 0) {
            return '<p class="text-text-secondary">No immunizations recorded</p>';
        }

        const rows = immunizations.map(imm => `
            <tr>
                <td>${imm.vaccine || 'Unknown'}</td>
                <td>${imm.date ? window.store.formatDate(imm.date) : 'Unknown'}</td>
                <td>${imm.status || 'Unknown'}</td>
                <td>${imm.route || 'Not specified'}</td>
                <td>${imm.manufacturer || 'Unknown'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Immunizations</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Vaccine</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Route</th>
                            <th>Manufacturer</th>
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
     * Render social history content
     */
    renderSocialHistoryContent(socialHistory) {
        if (socialHistory.length === 0) {
            return '<p class="text-text-secondary">No social history recorded</p>';
        }

        const rows = socialHistory.map(item => `
            <tr>
                <td>${item.type || 'Unknown'}</td>
                <td>${item.value || 'Not specified'}</td>
                <td>${item.status || 'Unknown'}</td>
                <td>${item.date ? window.store.formatDate(item.date) : 'Unknown'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Social History</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Value</th>
                            <th>Status</th>
                            <th>Date</th>
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
     * Render functional status content
     */
    renderFunctionalStatusContent(functionalStatus) {
        if (functionalStatus.length === 0) {
            return '<p class="text-text-secondary">No functional status recorded</p>';
        }

        const rows = functionalStatus.map(item => `
            <tr>
                <td>${item.assessment || 'Unknown'}</td>
                <td>${item.result || 'Not specified'}</td>
                <td>${item.status || 'Unknown'}</td>
                <td>${item.date ? window.store.formatDate(item.date) : 'Unknown'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Functional Status</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Assessment</th>
                            <th>Result</th>
                            <th>Status</th>
                            <th>Date</th>
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
     * Render plan of care content
     */
    renderPlanOfCareContent(planOfCare) {
        if (planOfCare.length === 0) {
            return '<p class="text-text-secondary">No plan of care recorded</p>';
        }

        const rows = planOfCare.map(item => `
            <tr>
                <td>${item.plan || 'Unknown'}</td>
                <td>${item.status || 'Unknown'}</td>
                <td>${item.plannedDate ? window.store.formatDate(item.plannedDate) : 'Unknown'}</td>
                <td>${item.notes || 'No notes'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Plan of Care</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Plan</th>
                            <th>Status</th>
                            <th>Planned Date</th>
                            <th>Notes</th>
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
     * Render notes content
     */
    renderNotesContent(notes) {
        if (notes.length === 0) {
            return '<p class="text-text-secondary">No clinical notes recorded</p>';
        }

        return `
            <div class="document-section">
                <h3>Clinical Notes</h3>
                ${notes.map(note => `
                    <div class="note-entry mb-4 p-4 bg-black/20 rounded border border-primary/10">
                        <div class="note-header mb-2">
                            <div class="flex justify-between items-start">
                                <div>
                                    <strong class="text-primary">${note.type || 'Clinical Note'}</strong>
                                    ${note.date ? `<span class="text-text-secondary ml-2">• ${window.store.formatDate(note.date)}</span>` : ''}
                                </div>
                                ${note.status ? `<span class="text-xs px-2 py-1 bg-primary/20 rounded">${note.status}</span>` : ''}
                            </div>
                            ${note.author !== 'Unknown' ? `<div class="text-sm text-text-secondary mt-1">Author: ${note.author}</div>` : ''}
                        </div>
                        <div class="note-content">
                            <pre class="whitespace-pre-wrap font-sans text-text-primary" style="font-family: inherit;">${this.escapeHtml(note.content || 'No content available')}</pre>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render advance directives content
     */
    renderAdvanceDirectivesContent(directives) {
        if (directives.length === 0) {
            return '<p class="text-text-secondary">No advance directives recorded</p>';
        }

        const rows = directives.map(directive => `
            <tr>
                <td>${directive.type || 'Unknown'}</td>
                <td>${directive.status || 'Not specified'}</td>
                <td>${directive.effectiveDate ? window.store.formatDate(directive.effectiveDate) : 'Unknown'}</td>
                <td>${directive.custodian || 'Unknown'}</td>
                <td>${directive.description || 'No description'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Advance Directives</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Effective Date</th>
                            <th>Custodian</th>
                            <th>Description</th>
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
     * Render assessment content
     */
    renderAssessmentContent(assessments) {
        if (assessments.length === 0) {
            return '<p class="text-text-secondary">No clinical assessments recorded</p>';
        }

        const rows = assessments.map(assessment => `
            <tr>
                <td>${assessment.assessment || 'Unknown'}</td>
                <td>${assessment.date ? window.store.formatDate(assessment.date) : 'Unknown'}</td>
                <td>${assessment.clinician || 'Unknown'}</td>
                <td>${assessment.findings || 'No findings'}</td>
                <td>${assessment.status || 'Not specified'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Clinical Assessment</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Assessment</th>
                            <th>Date</th>
                            <th>Clinician</th>
                            <th>Findings</th>
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
     * Render chief complaint content
     */
    renderChiefComplaintContent(complaint) {
        if (!complaint) {
            return '<p class="text-text-secondary">No chief complaint recorded</p>';
        }

        // Handle both array format (legacy) and object format (CCDA)
        if (Array.isArray(complaint)) {
            if (complaint.length === 0) {
                return '<p class="text-text-secondary">No chief complaint recorded</p>';
            }
            // Legacy array format
            return `
                <div class="document-section">
                    <h3>Chief Complaint</h3>
                    ${complaint.map(item => `
                        <div class="complaint-entry mb-4 p-4 bg-black/20 rounded border border-primary/10">
                            <div class="complaint-header mb-2">
                                <strong class="text-primary">Primary Concern</strong>
                                ${item.date ? `<span class="text-text-secondary ml-2">• ${window.store.formatDate(item.date)}</span>` : ''}
                            </div>
                            <div class="complaint-content">
                                <p class="text-text-primary">${this.escapeHtml(item.complaint || 'No complaint recorded')}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // CCDA object format
        const textContent = complaint.text || '';
        const structuredContent = complaint.structuredText || [];
        
        if (!textContent && (!structuredContent || structuredContent.length === 0)) {
            return '<p class="text-text-secondary">No chief complaint recorded</p>';
        }

        return `
            <div class="document-section">
                <h3>Chief Complaint</h3>
                <div class="complaint-entry mb-4 p-4 bg-black/20 rounded border border-primary/10">
                    <div class="complaint-header mb-2">
                        <strong class="text-primary">Chief Complaint</strong>
                        ${complaint.code ? `<span class="text-text-secondary ml-2">• Code: ${complaint.code}</span>` : ''}
                    </div>
                    <div class="complaint-content">
                        ${textContent ? `<p class="text-text-primary">${this.escapeHtml(textContent)}</p>` : ''}
                        ${structuredContent && structuredContent.length > 0 ? `
                            <div class="structured-content mt-2">
                                ${structuredContent.map(item => {
                                    if (item.type === 'list') {
                                        return `
                                            <ul class="text-text-primary">
                                                ${item.items.map(listItem => `<li>${this.escapeHtml(listItem)}</li>`).join('')}
                                            </ul>
                                        `;
                                    } else if (item.type === 'paragraph') {
                                        return `<p class="text-text-primary">${this.escapeHtml(item.text)}</p>`;
                                    }
                                    return '';
                                }).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render family history content
     */
    renderFamilyHistoryContent(history) {
        if (history.length === 0) {
            return '<p class="text-text-secondary">No family history recorded</p>';
        }

        const rows = history.map(item => `
            <tr>
                <td>${item.relationship || 'Unknown'}</td>
                <td>${item.relativeGender || 'Unknown'}</td>
                <td>${item.conditions?.map(c => c.condition).join(', ') || 'None'}</td>
                <td>${item.status || 'Not specified'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Family History</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Relationship</th>
                            <th>Gender</th>
                            <th>Conditions</th>
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
     * Render goals content
     */
    renderGoalsContent(goals) {
        if (goals.length === 0) {
            return '<p class="text-text-secondary">No goals recorded</p>';
        }

        const rows = goals.map(goal => `
            <tr>
                <td>${goal.goal || 'Unknown'}</td>
                <td>${goal.priority || 'Not specified'}</td>
                <td>${goal.targetDate ? window.store.formatDate(goal.targetDate) : 'Unknown'}</td>
                <td>${goal.status || 'Not specified'}</td>
                <td>${goal.progress || 'Unknown'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Goals</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Goal</th>
                            <th>Priority</th>
                            <th>Target Date</th>
                            <th>Status</th>
                            <th>Progress</th>
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
     * Render health concerns content
     */
    renderHealthConcernsContent(concerns) {
        if (concerns.length === 0) {
            return '<p class="text-text-secondary">No health concerns recorded</p>';
        }

        const rows = concerns.map(concern => `
            <tr>
                <td>${concern.concern || 'Unknown'}</td>
                <td>${concern.category || 'Not specified'}</td>
                <td>${concern.status || 'Not specified'}</td>
                <td>${concern.date ? window.store.formatDate(concern.date) : 'Unknown'}</td>
                <td>${concern.author || 'Unknown'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Health Concerns</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Concern</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Author</th>
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
     * Render instructions content
     */
    renderInstructionsContent(instructions) {
        if (instructions.length === 0) {
            return '<p class="text-text-secondary">No instructions recorded</p>';
        }

        return `
            <div class="document-section">
                <h3>Patient Instructions</h3>
                ${instructions.map(instruction => `
                    <div class="instruction-entry mb-4 p-4 bg-black/20 rounded border border-primary/10">
                        <div class="instruction-header mb-2">
                            <strong class="text-primary">${instruction.code || 'Instruction'}</strong>
                            ${instruction.date ? `<span class="text-text-secondary ml-2">• ${window.store.formatDate(instruction.date)}</span>` : ''}
                            ${instruction.status ? `<span class="text-xs px-2 py-1 bg-primary/20 rounded ml-2">${instruction.status}</span>` : ''}
                        </div>
                        <div class="instruction-content">
                            <p class="text-text-primary">${this.escapeHtml(instruction.instruction || 'No instruction content')}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderMedicalEquipmentContent(equipment) {
        if (equipment.length === 0) {
            return '<p class="text-text-secondary">No medical equipment recorded</p>';
        }

        const rows = equipment.map(device => `
            <tr>
                <td>${device.deviceName || 'Unknown'}</td>
                <td>${device.manufacturer || 'Unknown'}</td>
                <td>${device.serialNumber || 'Not specified'}</td>
                <td>${device.implantDate ? window.store.formatDate(device.implantDate) : 'Unknown'}</td>
                <td>${device.status || 'Not specified'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Medical Equipment</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Device Name</th>
                            <th>Manufacturer</th>
                            <th>Serial Number</th>
                            <th>Implant Date</th>
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

    renderMentalStatusContent(assessments) {
        if (assessments.length === 0) {
            return '<p class="text-text-secondary">No mental status assessments recorded</p>';
        }

        const rows = assessments.map(assessment => `
            <tr>
                <td>${assessment.assessment || 'Unknown'}</td>
                <td>${assessment.result || 'Not specified'}</td>
                <td>${assessment.date ? window.store.formatDate(assessment.date) : 'Unknown'}</td>
                <td>${assessment.examiner || 'Unknown'}</td>
                <td>${assessment.status || 'Not specified'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Mental Status</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Assessment</th>
                            <th>Result</th>
                            <th>Date</th>
                            <th>Examiner</th>
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

    renderNutritionContent(nutrition) {
        if (nutrition.length === 0) {
            return '<p class="text-text-secondary">No nutrition information recorded</p>';
        }

        const rows = nutrition.map(item => `
            <tr>
                <td>${item.dietType || 'Unknown'}</td>
                <td>${item.restrictions || 'None specified'}</td>
                <td>${item.calories || 'Not specified'}</td>
                <td>${item.protein || 'Not specified'}</td>
                <td>${item.date ? window.store.formatDate(item.date) : 'Unknown'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Nutrition</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Diet Type</th>
                            <th>Restrictions</th>
                            <th>Calories</th>
                            <th>Protein</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderPayersContent(payers) {
        if (payers.length === 0) {
            return '<p class="text-text-secondary">No insurance information recorded</p>';
        }

        const rows = payers.map(payer => `
            <tr>
                <td>${payer.payerName || 'Unknown'}</td>
                <td>${payer.policyNumber || 'Not specified'}</td>
                <td>${payer.groupNumber || 'Not specified'}</td>
                <td>${payer.policyType || 'Not specified'}</td>
                <td>${payer.effectiveDate ? window.store.formatDate(payer.effectiveDate) : 'Unknown'}</td>
                <td>${payer.expirationDate ? window.store.formatDate(payer.expirationDate) : 'Unknown'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Insurance Information</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Payer Name</th>
                            <th>Policy Number</th>
                            <th>Group Number</th>
                            <th>Policy Type</th>
                            <th>Effective Date</th>
                            <th>Expiration Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderPhysicalExamContent(exams) {
        if (exams.length === 0) {
            return '<p class="text-text-secondary">No physical exam findings recorded</p>';
        }

        const rows = exams.map(exam => `
            <tr>
                <td>${exam.bodySystem || 'Unknown'}</td>
                <td>${exam.findings || 'No findings'}</td>
                <td>${exam.abnormal ? 'Yes' : 'No'}</td>
                <td>${exam.date ? window.store.formatDate(exam.date) : 'Unknown'}</td>
                <td>${exam.examiner || 'Unknown'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Physical Exam</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>Body System</th>
                            <th>Findings</th>
                            <th>Abnormal</th>
                            <th>Date</th>
                            <th>Examiner</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderReasonForVisitContent(reasons) {
        if (reasons.length === 0) {
            return '<p class="text-text-secondary">No reason for visit recorded</p>';
        }

        return `
            <div class="document-section">
                <h3>Reason for Visit</h3>
                ${reasons.map(reason => `
                    <div class="reason-entry mb-4 p-4 bg-black/20 rounded border border-primary/10">
                        <div class="reason-header mb-2">
                            <strong class="text-primary">Visit Reason</strong>
                            ${reason.date ? `<span class="text-text-secondary ml-2">• ${window.store.formatDate(reason.date)}</span>` : ''}
                        </div>
                        <div class="reason-content">
                            <p class="text-text-primary">${this.escapeHtml(reason.reason || 'No reason specified')}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderReviewOfSystemsContent(systems) {
        if (systems.length === 0) {
            return '<p class="text-text-secondary">No review of systems recorded</p>';
        }

        const rows = systems.map(system => `
            <tr>
                <td>${system.system || 'Unknown'}</td>
                <td>${system.findings || 'No findings'}</td>
                <td>${system.status || 'Not specified'}</td>
                <td>${system.date ? window.store.formatDate(system.date) : 'Unknown'}</td>
            </tr>
        `).join('');

        return `
            <div class="document-section">
                <h3>Review of Systems</h3>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th>System</th>
                            <th>Findings</th>
                            <th>Status</th>
                            <th>Date</th>
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
     * Render raw XML content
     */
    renderRawXMLContent() {
        const rawXML = window.store?.getState('rawXML');
        if (!rawXML) {
            return '<p class="text-text-secondary">No raw XML content available</p>';
        }

        return `
            <div class="document-section">
                <div class="flex items-center justify-between mb-4">
                    <h3>Raw XML Content</h3>
                    <div class="flex gap-2">
                        <button id="format-xml-content" class="winamp-button px-3 py-2 text-sm hover:bg-secondary/20 transition-colors">
                            <svg class="w-4 h-4 mr-2 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 7h16M4 12h16M4 17h16"/>
                            </svg>
                            Format
                        </button>
                        <button id="copy-xml-content" class="winamp-button px-3 py-2 text-sm hover:bg-primary/20 transition-colors">
                            <svg class="w-4 h-4 mr-2 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                            </svg>
                            Copy
                        </button>
                    </div>
                </div>
                
                <!-- Find Controls -->
                <div id="xml-find-controls" class="bg-black/40 rounded border border-primary/30 p-3 mb-4 hidden">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-2 flex-1">
                            <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                            <input 
                                type="text" 
                                id="xml-search-input" 
                                placeholder="Search XML content..." 
                                class="bg-black/50 border border-primary/20 rounded px-3 py-1 text-primary text-sm flex-1 focus:outline-none focus:border-primary/50"
                            />
                        </div>
                        <div class="flex items-center gap-2">
                            <span id="xml-search-results" class="text-xs text-text-secondary">0/0</span>
                            <button id="xml-search-prev" class="winamp-button p-1 text-xs" title="Previous match (Shift+Enter)">
                                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="m15 18-6-6 6-6"/>
                                </svg>
                            </button>
                            <button id="xml-search-next" class="winamp-button p-1 text-xs" title="Next match (Enter)">
                                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="m9 18 6-6-6-6"/>
                                </svg>
                            </button>
                            <button id="xml-search-close" class="winamp-button p-1 text-xs" title="Close search (Escape)">
                                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="bg-black/30 rounded border border-primary/20 p-4" style="max-height: 600px; overflow: auto;">
                    <pre id="xml-content-display" class="text-xs font-mono text-text-secondary whitespace-pre leading-relaxed" style="font-family: 'Consolas', 'Monaco', 'Courier New', monospace; tab-size: 2;">${this.escapeHtml(rawXML)}</pre>
                </div>
            </div>
        `;
    }

    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Setup event listeners for raw XML tab buttons
     */
    setupRawXMLTabEvents() {
        // Format XML button
        const formatButton = document.getElementById('format-xml-content');
        formatButton?.addEventListener('click', () => {
            const rawXML = window.store?.getState('rawXML');
            const display = document.getElementById('xml-content-display');
            
            if (rawXML && display) {
                try {
                    const formattedXML = this.formatXML(rawXML);
                    display.textContent = formattedXML;
                    this.showToast('XML formatted successfully', 'success');
                } catch (error) {
                    console.error('Failed to format XML:', error);
                    this.showToast('Failed to format XML', 'error');
                }
            }
        });

        // Copy XML button
        const copyButton = document.getElementById('copy-xml-content');
        copyButton?.addEventListener('click', async () => {
            const rawXML = window.store?.getState('rawXML');
            
            if (rawXML) {
                try {
                    await navigator.clipboard.writeText(rawXML);
                    this.showToast('XML content copied to clipboard', 'success');
                } catch (error) {
                    console.error('Failed to copy XML:', error);
                    this.showToast('Failed to copy XML content', 'error');
                }
            }
        });

        // Setup find functionality
        this.setupXMLFindFunctionality();
    }

    /**
     * Setup XML find functionality
     */
    setupXMLFindFunctionality() {
        const searchInput = document.getElementById('xml-search-input');
        const findControls = document.getElementById('xml-find-controls');
        const searchResults = document.getElementById('xml-search-results');
        const prevButton = document.getElementById('xml-search-prev');
        const nextButton = document.getElementById('xml-search-next');
        const closeButton = document.getElementById('xml-search-close');
        const xmlDisplay = document.getElementById('xml-content-display');

        if (!searchInput || !findControls || !xmlDisplay) return;

        let matches = [];
        let currentMatchIndex = -1;
        let originalContent = '';

        // Store original content
        originalContent = xmlDisplay.textContent || '';

        // Search function
        const performSearch = (searchTerm) => {
            if (!searchTerm) {
                this.clearXMLSearch(xmlDisplay, originalContent);
                searchResults.textContent = '0/0';
                return;
            }

            // Clear previous search
            this.clearXMLSearch(xmlDisplay, originalContent);
            matches = [];
            currentMatchIndex = -1;

            // Find all matches (case insensitive)
            const content = originalContent;
            const regex = new RegExp(this.escapeRegex(searchTerm), 'gi');
            let match;
            
            while ((match = regex.exec(content)) !== null) {
                matches.push({
                    index: match.index,
                    length: searchTerm.length,
                    text: match[0]
                });
                
                // Prevent infinite loop for zero-length matches
                if (match.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
            }

            // Update results count
            searchResults.textContent = matches.length > 0 ? `0/${matches.length}` : '0/0';

            if (matches.length > 0) {
                this.highlightXMLMatches(xmlDisplay, matches, searchTerm);
                this.goToXMLMatch(0);
            }
        };

        // Navigate to specific match
        this.goToXMLMatch = (index) => {
            if (matches.length === 0 || index < 0 || index >= matches.length) return;

            currentMatchIndex = index;
            searchResults.textContent = `${currentMatchIndex + 1}/${matches.length}`;

            // Remove previous current highlight
            const prevCurrent = xmlDisplay.querySelector('.xml-search-current');
            if (prevCurrent) {
                prevCurrent.classList.remove('xml-search-current');
            }

            // Add current highlight to new match
            const allHighlights = xmlDisplay.querySelectorAll('.xml-search-match');
            if (allHighlights[currentMatchIndex]) {
                allHighlights[currentMatchIndex].classList.add('xml-search-current');
                allHighlights[currentMatchIndex].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        };

        // Search input events
        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.goToXMLMatch(currentMatchIndex - 1 < 0 ? matches.length - 1 : currentMatchIndex - 1);
                } else {
                    this.goToXMLMatch(currentMatchIndex + 1 >= matches.length ? 0 : currentMatchIndex + 1);
                }
            } else if (e.key === 'Escape') {
                this.closeXMLFind();
            }
        });

        // Navigation buttons
        prevButton?.addEventListener('click', () => {
            this.goToXMLMatch(currentMatchIndex - 1 < 0 ? matches.length - 1 : currentMatchIndex - 1);
        });

        nextButton?.addEventListener('click', () => {
            this.goToXMLMatch(currentMatchIndex + 1 >= matches.length ? 0 : currentMatchIndex + 1);
        });

        // Close button
        closeButton?.addEventListener('click', () => {
            this.closeXMLFind();
        });

        // Close find function
        this.closeXMLFind = () => {
            findControls.classList.add('hidden');
            this.clearXMLSearch(xmlDisplay, originalContent);
            searchInput.value = '';
            searchResults.textContent = '0/0';
            matches = [];
            currentMatchIndex = -1;
        };

        // Show find function
        this.showXMLFind = () => {
            originalContent = xmlDisplay.textContent || '';
            findControls.classList.remove('hidden');
            searchInput.focus();
        };
    }

    /**
     * Highlight matches in XML content
     */
    highlightXMLMatches(element, matches, searchTerm) {
        let content = element.textContent || '';
        let highlightedContent = '';
        let lastIndex = 0;

        // Sort matches by index
        matches.sort((a, b) => a.index - b.index);

        matches.forEach((match) => {
            // Add content before match
            highlightedContent += this.escapeHtml(content.substring(lastIndex, match.index));
            
            // Add highlighted match
            highlightedContent += `<mark class="xml-search-match bg-yellow-400/30 text-yellow-200">${this.escapeHtml(content.substring(match.index, match.index + match.length))}</mark>`;
            
            lastIndex = match.index + match.length;
        });

        // Add remaining content
        highlightedContent += this.escapeHtml(content.substring(lastIndex));

        element.innerHTML = highlightedContent;
    }

    /**
     * Clear XML search highlighting
     */
    clearXMLSearch(element, originalContent) {
        element.textContent = originalContent;
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
     * Format XML for display with proper indentation
     */
    formatXML(xml) {
        try {
            // Parse and serialize to normalize the XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xml, 'text/xml');
            
            // Check for parsing errors
            const errorNode = xmlDoc.querySelector('parsererror');
            if (errorNode) {
                console.warn('XML parsing error, using raw content');
                return this.indentXML(xml);
            }
            
            const serializer = new XMLSerializer();
            const normalized = serializer.serializeToString(xmlDoc);
            
            return this.indentXML(normalized);
        } catch (error) {
            console.warn('Failed to format XML:', error);
            return this.indentXML(xml); // Fallback to simple indentation
        }
    }

    /**
     * Simple XML indentation without full parsing
     */
    indentXML(xml) {
        let formatted = '';
        let indent = 0;
        const tab = '  '; // 2 spaces
        
        // Split by > and < to process tags
        xml.split(/>\s*</).forEach((node, index) => {
            if (index === 0) {
                // First element
                if (node.startsWith('<')) {
                    formatted += node + '>';
                } else {
                    formatted += '<' + node + '>';
                }
            } else if (index === xml.split(/>\s*</).length - 1) {
                // Last element
                formatted += '\n' + tab.repeat(Math.max(0, indent)) + '<' + node;
            } else {
                // Middle elements
                if (node.startsWith('/')) {
                    // Closing tag
                    indent--;
                    formatted += '\n' + tab.repeat(Math.max(0, indent)) + '<' + node + '>';
                } else if (node.endsWith('/')) {
                    // Self-closing tag
                    formatted += '\n' + tab.repeat(indent) + '<' + node + '>';
                } else {
                    // Opening tag
                    formatted += '\n' + tab.repeat(indent) + '<' + node + '>';
                    indent++;
                }
            }
        });
        
        return formatted;
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

    /**
     * Fallback legacy section rendering for backward compatibility
     */
    renderLegacySection(sectionId, sectionData, ccdDocument) {
        console.log(`=== renderLegacySection called for ${sectionId} ===`);
        console.log('sectionData:', sectionData);
        switch (sectionId) {
            case 'allergies':
                return this.renderAllergiesContent(sectionData || []);
            case 'medications':
                return this.renderMedicationsContent(sectionData || []);
            case 'problems':
                return this.renderProblemsContent(sectionData || []);
            case 'procedures':
                return this.renderProceduresContent(sectionData || []);
            case 'encounters':
                return this.renderEncountersContent(sectionData || []);
            case 'immunizations':
                return this.renderImmunizationsContent(sectionData || []);
            case 'vitals':
                return this.renderVitalsContent(sectionData || []);
            case 'labs':
                return this.renderLabsContent(sectionData || []);
            case 'results':
                return this.renderLabsContent(sectionData || []);
            case 'socialHistory':
                return this.renderSocialHistoryContent(sectionData || []);
            case 'functionalStatus':
                return this.renderFunctionalStatusContent(sectionData || []);
            case 'planOfCare':
                return this.renderPlanOfCareContent(sectionData || []);
            case 'notes':
                return this.renderNotesContent(sectionData || []);
            case 'advanceDirectives':
                return this.renderAdvanceDirectivesContent(sectionData || []);
            case 'assessment':
                return this.renderAssessmentContent(sectionData || []);
            case 'chiefComplaint':
                return this.renderChiefComplaintContent(sectionData || []);
            case 'familyHistory':
                return this.renderFamilyHistoryContent(sectionData || []);
            case 'goals':
                return this.renderGoalsContent(sectionData || []);
            case 'healthConcerns':
                return this.renderHealthConcernsContent(sectionData || []);
            case 'instructions':
                return this.renderInstructionsContent(sectionData || []);
            case 'medicalEquipment':
                return this.renderMedicalEquipmentContent(sectionData || []);
            case 'mentalStatus':
                return this.renderMentalStatusContent(sectionData || []);
            case 'nutrition':
                return this.renderNutritionContent(sectionData || []);
            case 'payers':
                return this.renderPayersContent(sectionData || []);
            case 'physicalExam':
                return this.renderPhysicalExamContent(sectionData || []);
            case 'reasonForVisit':
                return this.renderReasonForVisitContent(sectionData || []);
            case 'reviewOfSystems':
                return this.renderReviewOfSystemsContent(sectionData || []);
            default:
                return '<p class="text-text-secondary">Tab content not implemented</p>';
        }
    }
}

// Ensure UIManager is available globally first
window.UIManager = UIManager;
console.log('UIManager class loaded');

// Create global UI manager
try {
    window.uiManager = new UIManager();
    console.log('UIManager instance created successfully');
} catch (error) {
    console.error('Failed to create UIManager instance:', error);
    window.uiManager = null;
}