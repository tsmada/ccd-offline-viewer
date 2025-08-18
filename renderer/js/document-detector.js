/**
 * Document Type Detection and Validation for C-CDA 2.1
 * Detects document type based on template IDs and LOINC codes
 */
class DocumentTypeDetector {
    static DOCUMENT_TYPES = {
        'ccd': {
            templateId: '2.16.840.1.113883.10.20.22.1.2',
            typeCode: '34133-9',
            displayName: 'Continuity of Care Document',
            icon: '📋',
            description: 'Comprehensive clinical summary'
        },
        'carePlan': {
            templateId: '2.16.840.1.113883.10.20.22.1.15',
            typeCode: '52521-2',
            displayName: 'Care Plan',
            icon: '🎯',
            description: 'Patient care planning and goals'
        },
        'consultationNote': {
            templateId: '2.16.840.1.113883.10.20.22.1.4',
            typeCode: '11488-4',
            displayName: 'Consultation Note',
            icon: '👨‍⚕️',
            description: 'Specialist consultation documentation'
        },
        'diagnosticImaging': {
            templateId: '2.16.840.1.113883.10.20.22.1.5',
            typeCode: '18748-4',
            displayName: 'Diagnostic Imaging Report',
            icon: '🏥',
            description: 'Radiology and imaging results'
        },
        'dischargeSummary': {
            templateId: '2.16.840.1.113883.10.20.22.1.8',
            typeCode: '18842-5',
            displayName: 'Discharge Summary',
            icon: '🏠',
            description: 'Hospital discharge documentation'
        },
        'historyPhysical': {
            templateId: '2.16.840.1.113883.10.20.22.1.3',
            typeCode: '34117-2',
            displayName: 'History and Physical',
            icon: '🩺',
            description: 'Clinical assessment and examination'
        },
        'operative': {
            templateId: '2.16.840.1.113883.10.20.22.1.7',
            typeCode: '11504-8',
            displayName: 'Operative Note',
            icon: '⚕️',
            description: 'Surgical procedure documentation'
        },
        'procedure': {
            templateId: '2.16.840.1.113883.10.20.22.1.6',
            typeCode: '28570-0',
            displayName: 'Procedure Note',
            icon: '🔧',
            description: 'Medical procedure documentation'
        },
        'progress': {
            templateId: '2.16.840.1.113883.10.20.22.1.9',
            typeCode: '11506-3',
            displayName: 'Progress Note',
            icon: '📈',
            description: 'Ongoing care progress tracking'
        },
        'referral': {
            templateId: '2.16.840.1.113883.10.20.22.1.14',
            typeCode: '57133-1',
            displayName: 'Referral Note',
            icon: '📮',
            description: 'Provider referral documentation'
        },
        'transfer': {
            templateId: '2.16.840.1.113883.10.20.22.1.13',
            typeCode: '18761-7',
            displayName: 'Transfer Summary',
            icon: '🚑',
            description: 'Patient transfer documentation'
        }
    };

    /**
     * Detect document type from XML document
     * @param {Document|string} document - XML document or string
     * @returns {string} - Document type key or 'unknown'
     */
    static detectDocumentType(document) {
        try {
            let doc = document;
            if (typeof document === 'string') {
                const parser = new DOMParser();
                doc = parser.parseFromString(document, 'text/xml');
            }

            // Extract template IDs from the document
            const templates = this.extractTemplateIds(doc);
            
            // Also check LOINC codes in the document header
            const typeCodes = this.extractTypeCodes(doc);

            console.log('DocumentTypeDetector: Extracted templates:', templates);
            console.log('DocumentTypeDetector: Extracted type codes:', typeCodes);

            // Match against known document types
            for (const [type, config] of Object.entries(this.DOCUMENT_TYPES)) {
                // Primary check: template ID
                if (templates.includes(config.templateId)) {
                    console.log(`DocumentTypeDetector: Found match for type '${type}' via template ID '${config.templateId}'`);
                    return type;
                }
                
                // Secondary check: LOINC type code
                if (typeCodes.includes(config.typeCode)) {
                    console.log(`DocumentTypeDetector: Found match for type '${type}' via type code '${config.typeCode}'`);
                    return type;
                }
            }

            console.warn('Unknown document type detected', { templates, typeCodes });
            console.log('DocumentTypeDetector: Available document types:', Object.keys(this.DOCUMENT_TYPES));
            return 'unknown';
        } catch (error) {
            console.error('Error detecting document type:', error);
            return 'unknown';
        }
    }

    /**
     * Extract template IDs from document
     * @param {Document|Object} document - XML document or parsed object
     * @returns {Array<string>} - Array of template IDs
     */
    static extractTemplateIds(document) {
        const templateIds = [];
        
        try {
            // Handle both DOM documents and JavaScript objects
            if (document.querySelectorAll) {
                // DOM document
                const templateElements = document.querySelectorAll('templateId');
                console.log(`DocumentTypeDetector: Found ${templateElements.length} templateId elements (DOM)`);
                
                templateElements.forEach((element, index) => {
                    const root = element.getAttribute('root');
                    if (root) {
                        console.log(`DocumentTypeDetector: Template ${index + 1}: ${root}`);
                        templateIds.push(root);
                    }
                });

                // Also check for document-level templateId in ClinicalDocument
                const clinicalDoc = document.querySelector('ClinicalDocument');
                if (clinicalDoc) {
                    const docTemplates = clinicalDoc.querySelectorAll(':scope > templateId');
                    console.log(`DocumentTypeDetector: Found ${docTemplates.length} document-level templateId elements (DOM)`);
                    docTemplates.forEach((element, index) => {
                        const root = element.getAttribute('root');
                        if (root) {
                            console.log(`DocumentTypeDetector: Document template ${index + 1}: ${root}`);
                            templateIds.push(root);
                        }
                    });
                }
            } else {
                // JavaScript object from XML parser
                console.log('DocumentTypeDetector: Processing JavaScript object from XML parser');
                
                // Extract template IDs from object recursively
                this.extractTemplateIdsFromObject(document, templateIds);
                console.log(`DocumentTypeDetector: Found ${templateIds.length} templateId elements (Object)`);
            }

            const uniqueTemplateIds = [...new Set(templateIds)]; // Remove duplicates
            console.log('DocumentTypeDetector: Final unique template IDs:', uniqueTemplateIds);
            return uniqueTemplateIds;
        } catch (error) {
            console.error('Error extracting template IDs:', error);
            return [];
        }
    }
    
    /**
     * Recursively extract template IDs from JavaScript object
     * @param {Object} obj - Object to search
     * @param {Array} templateIds - Array to collect template IDs
     */
    static extractTemplateIdsFromObject(obj, templateIds) {
        if (!obj || typeof obj !== 'object') return;
        
        // Check if this object has templateId property
        if (obj.templateId) {
            const templates = Array.isArray(obj.templateId) ? obj.templateId : [obj.templateId];
            templates.forEach((template, index) => {
                const root = template['@_root'];
                if (root) {
                    console.log(`DocumentTypeDetector: Template found: ${root}`);
                    templateIds.push(root);
                }
            });
        }
        
        // Recursively search all properties
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && key !== '@_root') {
                if (Array.isArray(obj[key])) {
                    obj[key].forEach(item => {
                        this.extractTemplateIdsFromObject(item, templateIds);
                    });
                } else if (typeof obj[key] === 'object') {
                    this.extractTemplateIdsFromObject(obj[key], templateIds);
                }
            }
        }
    }

    /**
     * Extract type codes (LOINC codes) from document
     * @param {Document} document - XML document
     * @returns {Array<string>} - Array of type codes
     */
    static extractTypeCodes(document) {
        const typeCodes = [];
        
        try {
            // Look for type codes in the document header
            const codeElements = document.querySelectorAll('code');
            
            codeElements.forEach(element => {
                const code = element.getAttribute('code');
                const codeSystem = element.getAttribute('codeSystem');
                
                // LOINC code system: 2.16.840.1.113883.6.1
                if (code && codeSystem === '2.16.840.1.113883.6.1') {
                    typeCodes.push(code);
                }
            });

            return [...new Set(typeCodes)]; // Remove duplicates
        } catch (error) {
            console.error('Error extracting type codes:', error);
            return [];
        }
    }

    /**
     * Validate document type matches expected type
     * @param {Document|string} document - XML document or string
     * @param {string} expectedType - Expected document type key
     * @returns {boolean} - True if matches, false otherwise
     */
    static validateDocumentType(document, expectedType) {
        const detectedType = this.detectDocumentType(document);
        return detectedType === expectedType;
    }

    /**
     * Get document type configuration
     * @param {string} documentType - Document type key
     * @returns {Object|null} - Document type configuration or null
     */
    static getDocumentTypeConfig(documentType) {
        return this.DOCUMENT_TYPES[documentType] || null;
    }

    /**
     * Get all supported document types
     * @returns {Array<string>} - Array of supported document type keys
     */
    static getSupportedDocumentTypes() {
        return Object.keys(this.DOCUMENT_TYPES);
    }

    /**
     * Get document type by template ID
     * @param {string} templateId - Template ID to look up
     * @returns {string|null} - Document type key or null
     */
    static getDocumentTypeByTemplateId(templateId) {
        for (const [type, config] of Object.entries(this.DOCUMENT_TYPES)) {
            if (config.templateId === templateId) {
                return type;
            }
        }
        return null;
    }

    /**
     * Get document type by LOINC code
     * @param {string} typeCode - LOINC type code to look up
     * @returns {string|null} - Document type key or null
     */
    static getDocumentTypeByTypeCode(typeCode) {
        for (const [type, config] of Object.entries(this.DOCUMENT_TYPES)) {
            if (config.typeCode === typeCode) {
                return type;
            }
        }
        return null;
    }

    /**
     * Check if document type is supported
     * @param {string} documentType - Document type key to check
     * @returns {boolean} - True if supported, false otherwise
     */
    static isDocumentTypeSupported(documentType) {
        return documentType in this.DOCUMENT_TYPES;
    }

    /**
     * Get display information for document type
     * @param {string} documentType - Document type key
     * @returns {Object} - Display information with name, icon, description
     */
    static getDisplayInfo(documentType) {
        const config = this.getDocumentTypeConfig(documentType);
        if (!config) {
            return {
                displayName: 'Unknown Document',
                icon: '❓',
                description: 'Unrecognized document type'
            };
        }

        return {
            displayName: config.displayName,
            icon: config.icon,
            description: config.description
        };
    }

    /**
     * Extract document version information
     * @param {Document} document - XML document
     * @returns {Object} - Version information
     */
    static extractVersionInfo(document) {
        try {
            // Look for version indicators in template IDs and extensions
            const templateElements = document.querySelectorAll('templateId');
            const versionInfo = {
                ccdaVersion: null,
                templateVersions: [],
                extensions: []
            };

            templateElements.forEach(element => {
                const root = element.getAttribute('root');
                const extension = element.getAttribute('extension');
                
                if (root && extension) {
                    versionInfo.templateVersions.push({
                        templateId: root,
                        extension: extension
                    });
                }
            });

            // Detect C-CDA version based on template patterns
            const hasCCDA21Templates = versionInfo.templateVersions.some(
                tv => tv.extension && tv.extension.includes('2015-08-01')
            );

            if (hasCCDA21Templates) {
                versionInfo.ccdaVersion = '2.1';
            } else {
                versionInfo.ccdaVersion = 'unknown';
            }

            return versionInfo;
        } catch (error) {
            console.error('Error extracting version info:', error);
            return {
                ccdaVersion: 'unknown',
                templateVersions: [],
                extensions: []
            };
        }
    }
}

// Make available globally
window.DocumentTypeDetector = DocumentTypeDetector;
console.log('DocumentTypeDetector loaded');