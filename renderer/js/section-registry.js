/**
 * Dynamic Section Registry for Document Types
 * Manages sections available for each C-CDA document type
 */
class SectionRegistry {
    constructor() {
        this.sections = new Map();
        this.initializeSections();
    }

    /**
     * Initialize all section definitions
     */
    initializeSections() {
        // Common sections (available in most documents)
        this.registerSection('header', {
            templateId: null, // Header-based, no specific template
            label: 'Document Info',
            icon: '📄',
            required: true,
            documentTypes: ['*'], // Available in all documents
            parser: 'parseHeader',
            renderer: 'renderHeader'
        });

        this.registerSection('patient', {
            templateId: null, // Header-based
            label: 'Patient Info',
            icon: '👤',
            required: true,
            documentTypes: ['*'],
            parser: 'parsePatient',
            renderer: 'renderPatient'
        });

        // CCD and common clinical sections
        this.registerSection('allergies', {
            templateId: '2.16.840.1.113883.10.20.22.2.6',
            label: 'Allergies',
            icon: '⚠️',
            required: false,
            documentTypes: ['ccd', 'dischargeSummary', 'historyPhysical', 'consultationNote', 'progress'],
            parser: 'parseAllergies',
            renderer: 'renderAllergies'
        });

        this.registerSection('medications', {
            templateId: '2.16.840.1.113883.10.20.22.2.1',
            label: 'Medications',
            icon: '💊',
            required: false,
            documentTypes: ['ccd', 'dischargeSummary', 'historyPhysical', 'consultationNote', 'progress'],
            parser: 'parseMedications',
            renderer: 'renderMedications'
        });

        this.registerSection('problems', {
            templateId: '2.16.840.1.113883.10.20.22.2.5',
            label: 'Problems',
            icon: '🔍',
            required: false,
            documentTypes: ['ccd', 'dischargeSummary', 'historyPhysical', 'consultationNote', 'progress'],
            parser: 'parseProblems',
            renderer: 'renderProblems'
        });

        this.registerSection('procedures', {
            templateId: '2.16.840.1.113883.10.20.22.2.7',
            label: 'Procedures',
            icon: '🏥',
            required: false,
            documentTypes: ['ccd', 'dischargeSummary', 'historyPhysical', 'consultationNote', 'progress'],
            parser: 'parseProcedures',
            renderer: 'renderProcedures'
        });

        this.registerSection('vitals', {
            templateId: '2.16.840.1.113883.10.20.22.2.4',
            label: 'Vital Signs',
            icon: '📊',
            required: false,
            documentTypes: ['ccd', 'dischargeSummary', 'historyPhysical', 'consultationNote', 'progress'],
            parser: 'parseVitalSigns',
            renderer: 'renderVitals'
        });

        this.registerSection('labs', {
            templateId: '2.16.840.1.113883.10.20.22.2.3',
            label: 'Lab Results',
            icon: '🧪',
            required: false,
            documentTypes: ['ccd', 'dischargeSummary', 'historyPhysical', 'consultationNote', 'progress'],
            parser: 'parseLabResults',
            renderer: 'renderLabs'
        });

        this.registerSection('immunizations', {
            templateId: '2.16.840.1.113883.10.20.22.2.2',
            label: 'Immunizations',
            icon: '💉',
            required: false,
            documentTypes: ['ccd', 'historyPhysical', 'progress'],
            parser: 'parseImmunizations',
            renderer: 'renderImmunizations'
        });

        // Care Plan specific sections
        this.registerSection('healthConcerns', {
            templateId: '2.16.840.1.113883.10.20.22.2.58',
            label: 'Health Concerns',
            icon: '⚠️',
            required: true,
            documentTypes: ['carePlan'],
            parser: 'parseHealthConcerns',
            renderer: 'renderHealthConcerns'
        });

        this.registerSection('goals', {
            templateId: '2.16.840.1.113883.10.20.22.2.60',
            label: 'Goals',
            icon: '🎯',
            required: true,
            documentTypes: ['carePlan'],
            parser: 'parseGoals',
            renderer: 'renderGoals'
        });

        this.registerSection('interventions', {
            templateId: '2.16.840.1.113883.10.20.21.2.3',
            label: 'Interventions',
            icon: '🔧',
            required: true,
            documentTypes: ['carePlan'],
            parser: 'parseInterventions',
            renderer: 'renderInterventions'
        });

        // History & Physical specific sections
        this.registerSection('chiefComplaint', {
            templateId: ['2.16.840.1.113883.10.20.22.2.13', '1.3.6.1.4.1.19376.1.5.3.1.1.13.2.1'],
            label: 'Chief Complaint',
            icon: '💬',
            required: false,
            documentTypes: ['historyPhysical', 'progress'],
            parser: 'parseChiefComplaint',
            renderer: 'renderChiefComplaint'
        });

        this.registerSection('presentIllness', {
            templateId: '1.3.6.1.4.1.19376.1.5.3.1.3.4',
            label: 'History of Present Illness',
            icon: '📋',
            required: true,
            documentTypes: ['historyPhysical'],
            parser: 'parsePresentIllness',
            renderer: 'renderPresentIllness'
        });

        this.registerSection('reviewOfSystems', {
            templateId: ['2.16.840.1.113883.10.20.22.2.44', '1.3.6.1.4.1.19376.1.5.3.1.3.18'],
            label: 'Review of Systems',
            icon: '📋',
            required: false,
            documentTypes: ['historyPhysical', 'progress'],
            parser: 'parseReviewOfSystems',
            renderer: 'renderReviewOfSystems'
        });

        this.registerSection('physicalExam', {
            templateId: '2.16.840.1.113883.10.20.2.10',
            label: 'Physical Examination',
            icon: '🩺',
            required: false,
            documentTypes: ['historyPhysical', 'progress'],
            parser: 'parsePhysicalExam',
            renderer: 'renderPhysicalExam'
        });

        this.registerSection('assessment', {
            templateId: ['2.16.840.1.113883.10.20.22.2.9', '2.16.840.1.113883.10.20.22.2.8'],
            label: 'Assessment and Plan',
            icon: '🩺',
            required: false,
            documentTypes: ['historyPhysical', 'progress'],
            parser: 'parseAssessment',
            renderer: 'renderAssessment'
        });

        // Surgical sections (Operative & Procedure Notes)
        this.registerSection('preoperativeDx', {
            templateId: '2.16.840.1.113883.10.20.22.2.34',
            label: 'Preoperative Diagnosis',
            icon: '🔍',
            required: true,
            documentTypes: ['operative'],
            parser: 'parsePreoperativeDx',
            renderer: 'renderPreoperativeDx'
        });

        this.registerSection('postoperativeDx', {
            templateId: '2.16.840.1.113883.10.20.22.2.35',
            label: 'Postoperative Diagnosis',
            icon: '✅',
            required: true,
            documentTypes: ['operative'],
            parser: 'parsePostoperativeDx',
            renderer: 'renderPostoperativeDx'
        });

        this.registerSection('procedureDescription', {
            templateId: '2.16.840.1.113883.10.20.22.2.27',
            label: 'Procedure Description',
            icon: '📝',
            required: true,
            documentTypes: ['operative', 'procedure'],
            parser: 'parseProcedureDescription',
            renderer: 'renderProcedureDescription'
        });

        this.registerSection('anesthesia', {
            templateId: '2.16.840.1.113883.10.20.22.2.25',
            label: 'Anesthesia',
            icon: '💊',
            required: false,
            documentTypes: ['operative', 'procedure'],
            parser: 'parseAnesthesia',
            renderer: 'renderAnesthesia'
        });

        this.registerSection('complications', {
            templateId: '2.16.840.1.113883.10.20.22.2.37',
            label: 'Complications',
            icon: '⚠️',
            required: false,
            documentTypes: ['operative', 'procedure'],
            parser: 'parseComplications',
            renderer: 'renderComplications'
        });

        this.registerSection('bloodLoss', {
            templateId: '2.16.840.1.113883.10.20.18.2.9',
            label: 'Estimated Blood Loss',
            icon: '🩸',
            required: false,
            documentTypes: ['operative'],
            parser: 'parseBloodLoss',
            renderer: 'renderBloodLoss'
        });

        this.registerSection('surgicalSpecimens', {
            templateId: '2.16.840.1.113883.10.20.7.13',
            label: 'Surgical Specimens',
            icon: '🧪',
            required: false,
            documentTypes: ['operative'],
            parser: 'parseSurgicalSpecimens',
            renderer: 'renderSurgicalSpecimens'
        });

        // Procedure Note specific sections
        this.registerSection('procedureIndications', {
            templateId: '2.16.840.1.113883.10.20.22.2.29',
            label: 'Procedure Indications',
            icon: '📋',
            required: true,
            documentTypes: ['procedure'],
            parser: 'parseProcedureIndications',
            renderer: 'renderProcedureIndications'
        });

        this.registerSection('procedureFindings', {
            templateId: '2.16.840.1.113883.10.20.22.2.28',
            label: 'Procedure Findings',
            icon: '🔍',
            required: false,
            documentTypes: ['procedure'],
            parser: 'parseProcedureFindings',
            renderer: 'renderProcedureFindings'
        });

        // Discharge Summary specific sections
        this.registerSection('admissionDx', {
            templateId: '2.16.840.1.113883.10.20.22.2.43',
            label: 'Admission Diagnosis',
            icon: '🏥',
            required: true,
            documentTypes: ['dischargeSummary'],
            parser: 'parseAdmissionDx',
            renderer: 'renderAdmissionDx'
        });

        this.registerSection('dischargeDx', {
            templateId: '2.16.840.1.113883.10.20.22.2.24',
            label: 'Discharge Diagnosis',
            icon: '🏠',
            required: true,
            documentTypes: ['dischargeSummary'],
            parser: 'parseDischargeDx',
            renderer: 'renderDischargeDx'
        });

        this.registerSection('hospitalCourse', {
            templateId: '1.3.6.1.4.1.19376.1.5.3.1.3.5',
            label: 'Hospital Course',
            icon: '📈',
            required: true,
            documentTypes: ['dischargeSummary'],
            parser: 'parseHospitalCourse',
            renderer: 'renderHospitalCourse'
        });

        this.registerSection('dischargeInstructions', {
            templateId: '2.16.840.1.113883.10.20.22.2.41',
            label: 'Discharge Instructions',
            icon: '📋',
            required: false,
            documentTypes: ['dischargeSummary'],
            parser: 'parseDischargeInstructions',
            renderer: 'renderDischargeInstructions'
        });

        this.registerSection('hospitalConsultations', {
            templateId: '2.16.840.1.113883.10.20.22.2.42',
            label: 'Hospital Consultations',
            icon: '👨‍⚕️',
            required: false,
            documentTypes: ['dischargeSummary'],
            parser: 'parseHospitalConsultations',
            renderer: 'renderHospitalConsultations'
        });

        // Diagnostic Imaging specific sections
        this.registerSection('dicomCatalog', {
            templateId: '2.16.840.1.113883.10.20.6.1.1',
            label: 'DICOM Object Catalog',
            icon: '🖼️',
            required: true,
            documentTypes: ['diagnosticImaging'],
            parser: 'parseDICOMCatalog',
            renderer: 'renderDICOMCatalog'
        });

        this.registerSection('findings', {
            templateId: '2.16.840.1.113883.10.20.6.1.2',
            label: 'Findings',
            icon: '🔍',
            required: true,
            documentTypes: ['diagnosticImaging'],
            parser: 'parseFindings',
            renderer: 'renderFindings'
        });

        this.registerSection('impressions', {
            templateId: null, // Custom section
            label: 'Impressions',
            icon: '💭',
            required: false,
            documentTypes: ['diagnosticImaging'],
            parser: 'parseImpressions',
            renderer: 'renderImpressions'
        });

        // Consultation Note specific sections
        this.registerSection('reasonForReferral', {
            templateId: null, // Custom section
            label: 'Reason for Referral',
            icon: '📮',
            required: true,
            documentTypes: ['consultationNote'],
            parser: 'parseReasonForReferral',
            renderer: 'renderReasonForReferral'
        });

        this.registerSection('consultationRequest', {
            templateId: null, // Custom section
            label: 'Consultation Request',
            icon: '📋',
            required: false,
            documentTypes: ['consultationNote'],
            parser: 'parseConsultationRequest',
            renderer: 'renderConsultationRequest'
        });

        this.registerSection('recommendations', {
            templateId: null, // Custom section
            label: 'Recommendations',
            icon: '💡',
            required: false,
            documentTypes: ['consultationNote'],
            parser: 'parseRecommendations',
            renderer: 'renderRecommendations'
        });

        // Progress Note specific sections
        this.registerSection('planOfTreatment', {
            templateId: '2.16.840.1.113883.10.20.22.2.10',
            label: 'Plan of Treatment',
            icon: '📋',
            required: true,
            documentTypes: ['progress'],
            parser: 'parsePlanOfTreatment',
            renderer: 'renderPlanOfTreatment'
        });

        // Subjective Data section (Progress Notes)
        this.registerSection('subjectiveData', {
            templateId: '2.16.840.1.113883.10.20.21.2.2',
            label: 'Subjective Data',
            icon: '💭',
            required: false,
            documentTypes: ['progress'],
            parser: 'parseSubjectiveData',
            renderer: 'renderGenericSection'
        });

        // Objective Data section (Progress Notes)
        this.registerSection('objectiveData', {
            templateId: '2.16.840.1.113883.10.20.21.2.1',
            label: 'Objective Data',
            icon: '🔍',
            required: false,
            documentTypes: ['progress'],
            parser: 'parseObjectiveData',
            renderer: 'renderGenericSection'
        });

        this.registerSection('instructions', {
            templateId: '2.16.840.1.113883.10.20.22.2.45',
            label: 'Instructions',
            icon: '📋',
            required: false,
            documentTypes: ['progress', 'dischargeSummary'],
            parser: 'parseInstructions',
            renderer: 'renderInstructions'
        });

        // Referral Note specific sections
        this.registerSection('referralReason', {
            templateId: null, // Custom section
            label: 'Reason for Referral',
            icon: '📮',
            required: true,
            documentTypes: ['referral'],
            parser: 'parseReferralReason',
            renderer: 'renderReferralReason'
        });

        this.registerSection('referralRequest', {
            templateId: null, // Custom section
            label: 'Referral Request',
            icon: '📋',
            required: true,
            documentTypes: ['referral'],
            parser: 'parseReferralRequest',
            renderer: 'renderReferralRequest'
        });

        this.registerSection('referringProvider', {
            templateId: null, // Custom section
            label: 'Referring Provider',
            icon: '👨‍⚕️',
            required: false,
            documentTypes: ['referral'],
            parser: 'parseReferringProvider',
            renderer: 'renderReferringProvider'
        });

        // Transfer Summary specific sections
        this.registerSection('transferDx', {
            templateId: null, // Custom section
            label: 'Transfer Diagnosis',
            icon: '🚑',
            required: true,
            documentTypes: ['transfer'],
            parser: 'parseTransferDx',
            renderer: 'renderTransferDx'
        });

        this.registerSection('transferSummary', {
            templateId: null, // Custom section
            label: 'Transfer Summary',
            icon: '📋',
            required: true,
            documentTypes: ['transfer'],
            parser: 'parseTransferSummary',
            renderer: 'renderTransferSummary'
        });

        this.registerSection('receivingProvider', {
            templateId: null, // Custom section
            label: 'Receiving Provider',
            icon: '🏥',
            required: false,
            documentTypes: ['transfer'],
            parser: 'parseReceivingProvider',
            renderer: 'renderReceivingProvider'
        });

        // Raw XML section (available for all documents)
        this.registerSection('rawXML', {
            templateId: null,
            label: 'Raw XML',
            icon: '📄',
            required: false,
            documentTypes: ['*'],
            parser: 'parseRawXML',
            renderer: 'renderRawXML'
        });
    }

    /**
     * Register a new section
     * @param {string} id - Section identifier
     * @param {Object} config - Section configuration
     */
    registerSection(id, config) {
        this.sections.set(id, { id, ...config });
    }

    /**
     * Get supported sections for a document type
     * @param {string} documentType - Document type key
     * @returns {Array<Object>} - Array of supported section configurations
     */
    getSupportedSections(documentType) {
        if (!documentType) {
            return [];
        }

        return Array.from(this.sections.values())
            .filter(section => 
                section.documentTypes.includes('*') || 
                section.documentTypes.includes(documentType)
            )
            .sort((a, b) => {
                // Sort required sections first, then by label
                if (a.required && !b.required) return -1;
                if (!a.required && b.required) return 1;
                return a.label.localeCompare(b.label);
            });
    }

    /**
     * Get required sections for a document type
     * @param {string} documentType - Document type key
     * @returns {Array<Object>} - Array of required section configurations
     */
    getRequiredSections(documentType) {
        return this.getSupportedSections(documentType)
            .filter(section => section.required);
    }

    /**
     * Get optional sections for a document type
     * @param {string} documentType - Document type key
     * @returns {Array<Object>} - Array of optional section configurations
     */
    getOptionalSections(documentType) {
        return this.getSupportedSections(documentType)
            .filter(section => !section.required);
    }

    /**
     * Get section by ID
     * @param {string} sectionId - Section identifier
     * @returns {Object|null} - Section configuration or null
     */
    getSection(sectionId) {
        return this.sections.get(sectionId) || null;
    }

    /**
     * Check if section is supported for document type
     * @param {string} sectionId - Section identifier
     * @param {string} documentType - Document type key
     * @returns {boolean} - True if supported, false otherwise
     */
    isSectionSupported(sectionId, documentType) {
        const section = this.getSection(sectionId);
        if (!section) return false;
        
        return section.documentTypes.includes('*') || 
               section.documentTypes.includes(documentType);
    }

    /**
     * Get section by template ID
     * @param {string} templateId - Template ID to look up
     * @returns {Object|null} - Section configuration or null
     */
    getSectionByTemplateId(templateId) {
        for (const section of this.sections.values()) {
            if (section.templateId === templateId) {
                return section;
            }
        }
        return null;
    }

    /**
     * Get all sections with a specific template ID
     * @param {string} templateId - Template ID to look up
     * @returns {Array<Object>} - Array of matching section configurations
     */
    getSectionsByTemplateId(templateId) {
        return Array.from(this.sections.values())
            .filter(section => section.templateId === templateId);
    }

    /**
     * Get section parsing method name
     * @param {string} sectionId - Section identifier
     * @returns {string|null} - Parser method name or null
     */
    getParserMethod(sectionId) {
        const section = this.getSection(sectionId);
        return section ? section.parser : null;
    }

    /**
     * Get section rendering method name
     * @param {string} sectionId - Section identifier
     * @returns {string|null} - Renderer method name or null
     */
    getRendererMethod(sectionId) {
        const section = this.getSection(sectionId);
        return section ? section.renderer : null;
    }

    /**
     * Validate document sections against requirements
     * @param {Object} document - Parsed document object
     * @param {string} documentType - Document type key
     * @returns {Array<string>} - Array of validation error messages
     */
    validateDocumentSections(document, documentType) {
        const errors = [];
        const requiredSections = this.getRequiredSections(documentType);

        requiredSections.forEach(section => {
            if (!document[section.id] || 
                (Array.isArray(document[section.id]) && document[section.id].length === 0)) {
                errors.push(`Missing required section: ${section.label}`);
            }
        });

        return errors;
    }

    /**
     * Get document type statistics
     * @param {string} documentType - Document type key
     * @returns {Object} - Statistics about sections for the document type
     */
    getDocumentTypeStats(documentType) {
        const supported = this.getSupportedSections(documentType);
        const required = this.getRequiredSections(documentType);
        const optional = this.getOptionalSections(documentType);

        return {
            totalSections: supported.length,
            requiredSections: required.length,
            optionalSections: optional.length,
            sectionIds: supported.map(s => s.id)
        };
    }
}

// Make available globally
window.SectionRegistry = SectionRegistry;
console.log('SectionRegistry loaded');