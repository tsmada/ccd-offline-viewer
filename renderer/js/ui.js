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
            { id: 'immunizations', label: 'Immunizations', icon: '💉' },
            { id: 'vitals', label: 'Vital Signs', icon: '📊' },
            { id: 'labs', label: 'Lab Results', icon: '🧪' },
            { id: 'socialHistory', label: 'Social History', icon: '🚭' },
            { id: 'functionalStatus', label: 'Functional Status', icon: '♿' },
            { id: 'planOfCare', label: 'Plan of Care', icon: '📝' },
            { id: 'notes', label: 'Notes', icon: '📑' },
            { id: 'advanceDirectives', label: 'Advance Directives', icon: '📋' },
            { id: 'assessment', label: 'Assessment', icon: '🩺' },
            { id: 'chiefComplaint', label: 'Chief Complaint', icon: '💬' },
            { id: 'familyHistory', label: 'Family History', icon: '👨‍👩‍👧‍👦' },
            { id: 'goals', label: 'Goals', icon: '🎯' },
            { id: 'healthConcerns', label: 'Health Concerns', icon: '⚠️' },
            { id: 'instructions', label: 'Instructions', icon: '📋' },
            { id: 'medicalEquipment', label: 'Medical Equipment', icon: '🔧' },
            { id: 'mentalStatus', label: 'Mental Status', icon: '🧠' },
            { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
            { id: 'payers', label: 'Insurance', icon: '💳' },
            { id: 'physicalExam', label: 'Physical Exam', icon: '🩺' },
            { id: 'reasonForVisit', label: 'Reason for Visit', icon: '🏥' },
            { id: 'reviewOfSystems', label: 'Review of Systems', icon: '📋' },
            { id: 'rawXML', label: 'Raw XML', icon: '📄' }
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
            
            // Store raw XML content
            window.store.setRawXML(content);
            
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
            case 'immunizations': return document.immunizations?.length > 0;
            case 'vitals': return document.vitalSigns?.length > 0;
            case 'labs': return document.labResults?.length > 0;
            case 'socialHistory': return document.socialHistory?.length > 0;
            case 'functionalStatus': return document.functionalStatus?.length > 0;
            case 'planOfCare': return document.planOfCare?.length > 0;
            case 'notes': return document.notes?.length > 0;
            case 'advanceDirectives': return document.advanceDirectives?.length > 0;
            case 'assessment': return document.assessment?.length > 0;
            case 'chiefComplaint': return document.chiefComplaint?.length > 0;
            case 'familyHistory': return document.familyHistory?.length > 0;
            case 'goals': return document.goals?.length > 0;
            case 'healthConcerns': return document.healthConcerns?.length > 0;
            case 'instructions': return document.instructions?.length > 0;
            case 'medicalEquipment': return document.medicalEquipment?.length > 0;
            case 'mentalStatus': return document.mentalStatus?.length > 0;
            case 'nutrition': return document.nutrition?.length > 0;
            case 'payers': return document.payers?.length > 0;
            case 'physicalExam': return document.physicalExam?.length > 0;
            case 'reasonForVisit': return document.reasonForVisit?.length > 0;
            case 'reviewOfSystems': return document.reviewOfSystems?.length > 0;
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
            case 'immunizations':
                content = this.renderImmunizationsContent(ccdDocument.immunizations || []);
                break;
            case 'vitals':
                content = this.renderVitalsContent(ccdDocument.vitalSigns || []);
                break;
            case 'labs':
                content = this.renderLabsContent(ccdDocument.labResults || []);
                break;
            case 'socialHistory':
                content = this.renderSocialHistoryContent(ccdDocument.socialHistory || []);
                break;
            case 'functionalStatus':
                content = this.renderFunctionalStatusContent(ccdDocument.functionalStatus || []);
                break;
            case 'planOfCare':
                content = this.renderPlanOfCareContent(ccdDocument.planOfCare || []);
                break;
            case 'notes':
                content = this.renderNotesContent(ccdDocument.notes || []);
                break;
            case 'advanceDirectives':
                content = this.renderAdvanceDirectivesContent(ccdDocument.advanceDirectives || []);
                break;
            case 'assessment':
                content = this.renderAssessmentContent(ccdDocument.assessment || []);
                break;
            case 'chiefComplaint':
                content = this.renderChiefComplaintContent(ccdDocument.chiefComplaint || []);
                break;
            case 'familyHistory':
                content = this.renderFamilyHistoryContent(ccdDocument.familyHistory || []);
                break;
            case 'goals':
                content = this.renderGoalsContent(ccdDocument.goals || []);
                break;
            case 'healthConcerns':
                content = this.renderHealthConcernsContent(ccdDocument.healthConcerns || []);
                break;
            case 'instructions':
                content = this.renderInstructionsContent(ccdDocument.instructions || []);
                break;
            case 'medicalEquipment':
                content = this.renderMedicalEquipmentContent(ccdDocument.medicalEquipment || []);
                break;
            case 'mentalStatus':
                content = this.renderMentalStatusContent(ccdDocument.mentalStatus || []);
                break;
            case 'nutrition':
                content = this.renderNutritionContent(ccdDocument.nutrition || []);
                break;
            case 'payers':
                content = this.renderPayersContent(ccdDocument.payers || []);
                break;
            case 'physicalExam':
                content = this.renderPhysicalExamContent(ccdDocument.physicalExam || []);
                break;
            case 'reasonForVisit':
                content = this.renderReasonForVisitContent(ccdDocument.reasonForVisit || []);
                break;
            case 'reviewOfSystems':
                content = this.renderReviewOfSystemsContent(ccdDocument.reviewOfSystems || []);
                break;
            case 'rawXML':
                content = this.renderRawXMLContent();
                break;
            default:
                content = '<p class="text-text-secondary">Tab content not implemented</p>';
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
    renderChiefComplaintContent(complaints) {
        if (complaints.length === 0) {
            return '<p class="text-text-secondary">No chief complaint recorded</p>';
        }

        return `
            <div class="document-section">
                <h3>Chief Complaint</h3>
                ${complaints.map(complaint => `
                    <div class="complaint-entry mb-4 p-4 bg-black/20 rounded border border-primary/10">
                        <div class="complaint-header mb-2">
                            <strong class="text-primary">Primary Concern</strong>
                            ${complaint.date ? `<span class="text-text-secondary ml-2">• ${window.store.formatDate(complaint.date)}</span>` : ''}
                        </div>
                        <div class="complaint-content">
                            <p class="text-text-primary">${this.escapeHtml(complaint.complaint || 'No complaint recorded')}</p>
                        </div>
                    </div>
                `).join('')}
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
}

// Create global UI manager
window.uiManager = new UIManager();