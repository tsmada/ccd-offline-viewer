/**
 * C-CDA Version Detection and Tracking
 * Handles version identification and compatibility validation
 */
class VersionTracker {
    static SUPPORTED_VERSIONS = {
        '2.1': {
            release: '2.1',
            templateVersion: '2015-08-01',
            description: 'C-CDA Release 2.1',
            supportedDocuments: [
                'ccd', 'carePlan', 'consultationNote', 'diagnosticImaging',
                'dischargeSummary', 'historyPhysical', 'operative',
                'procedure', 'progress', 'referral', 'transfer'
            ],
            templatePatterns: [
                /2015-08-01/,
                /2\.16\.840\.1\.113883\.10\.20\.22\.1\.\d+/
            ]
        },
        '2.0': {
            release: '2.0',
            templateVersion: '2014-06-09',
            description: 'C-CDA Release 2.0',
            supportedDocuments: [
                'ccd', 'consultationNote', 'dischargeSummary', 
                'historyPhysical', 'operative', 'procedure', 'progress'
            ],
            templatePatterns: [
                /2014-06-09/,
                /2\.16\.840\.1\.113883\.10\.20\.22\.1\.\d+/
            ]
        },
        '1.1': {
            release: '1.1',
            templateVersion: '2012-01-06',
            description: 'C-CDA Release 1.1',
            supportedDocuments: [
                'ccd', 'consultationNote', 'dischargeSummary', 
                'historyPhysical', 'operative', 'procedure'
            ],
            templatePatterns: [
                /2012-01-06/,
                /2\.16\.840\.1\.113883\.10\.20\.22\.1\.\d+/
            ]
        }
    };

    static TEMPLATE_VERSION_MAP = {
        // C-CDA 2.1 Templates (2015-08-01)
        '2.16.840.1.113883.10.20.22.1.1:2015-08-01': '2.1', // US Realm Header
        '2.16.840.1.113883.10.20.22.1.2:2015-08-01': '2.1', // CCD
        '2.16.840.1.113883.10.20.22.1.3:2015-08-01': '2.1', // History and Physical
        '2.16.840.1.113883.10.20.22.1.4:2015-08-01': '2.1', // Consultation Note
        '2.16.840.1.113883.10.20.22.1.5:2015-08-01': '2.1', // Diagnostic Imaging
        '2.16.840.1.113883.10.20.22.1.6:2015-08-01': '2.1', // Procedure Note
        '2.16.840.1.113883.10.20.22.1.7:2015-08-01': '2.1', // Operative Note
        '2.16.840.1.113883.10.20.22.1.8:2015-08-01': '2.1', // Discharge Summary
        '2.16.840.1.113883.10.20.22.1.9:2015-08-01': '2.1', // Progress Note
        '2.16.840.1.113883.10.20.22.1.13:2015-08-01': '2.1', // Transfer Summary
        '2.16.840.1.113883.10.20.22.1.14:2015-08-01': '2.1', // Referral Note
        '2.16.840.1.113883.10.20.22.1.15:2015-08-01': '2.1', // Care Plan

        // C-CDA 2.0 Templates (2014-06-09)
        '2.16.840.1.113883.10.20.22.1.1:2014-06-09': '2.0', // US Realm Header
        '2.16.840.1.113883.10.20.22.1.2:2014-06-09': '2.0', // CCD
        '2.16.840.1.113883.10.20.22.1.3:2014-06-09': '2.0', // History and Physical
        '2.16.840.1.113883.10.20.22.1.4:2014-06-09': '2.0', // Consultation Note
        '2.16.840.1.113883.10.20.22.1.6:2014-06-09': '2.0', // Procedure Note
        '2.16.840.1.113883.10.20.22.1.7:2014-06-09': '2.0', // Operative Note
        '2.16.840.1.113883.10.20.22.1.8:2014-06-09': '2.0', // Discharge Summary
        '2.16.840.1.113883.10.20.22.1.9:2014-06-09': '2.0', // Progress Note

        // C-CDA 1.1 Templates (2012-01-06)
        '2.16.840.1.113883.10.20.22.1.1:2012-01-06': '1.1', // US Realm Header
        '2.16.840.1.113883.10.20.22.1.2:2012-01-06': '1.1', // CCD
        '2.16.840.1.113883.10.20.22.1.3:2012-01-06': '1.1', // History and Physical
        '2.16.840.1.113883.10.20.22.1.4:2012-01-06': '1.1', // Consultation Note
        '2.16.840.1.113883.10.20.22.1.6:2012-01-06': '1.1', // Procedure Note
        '2.16.840.1.113883.10.20.22.1.7:2012-01-06': '1.1', // Operative Note
        '2.16.840.1.113883.10.20.22.1.8:2012-01-06': '1.1'  // Discharge Summary
    };

    /**
     * Detect C-CDA version from document
     * @param {Document|string} document - XML document or string
     * @returns {string} - Detected version (e.g., '2.1', '2.0', '1.1') or 'unknown'
     */
    static detectVersion(document) {
        try {
            let doc = document;
            if (typeof document === 'string') {
                const parser = new DOMParser();
                doc = parser.parseFromString(document, 'text/xml');
            }

            const versionInfo = this.extractVersionInfo(doc);
            
            // Primary method: Check template ID + extension combinations
            const templateVersions = versionInfo.templateVersions;
            for (const tv of templateVersions) {
                const key = `${tv.templateId}:${tv.extension}`;
                if (this.TEMPLATE_VERSION_MAP[key]) {
                    return this.TEMPLATE_VERSION_MAP[key];
                }
            }

            // Secondary method: Pattern matching on extensions
            for (const [version, config] of Object.entries(this.SUPPORTED_VERSIONS)) {
                for (const pattern of config.templatePatterns) {
                    const hasMatchingExtension = templateVersions.some(tv => 
                        tv.extension && pattern.test(tv.extension)
                    );
                    if (hasMatchingExtension) {
                        return version;
                    }
                }
            }

            // Fallback: Check for specific version indicators in text
            const docText = doc.documentElement?.textContent || '';
            if (docText.includes('2015-08-01')) return '2.1';
            if (docText.includes('2014-06-09')) return '2.0';
            if (docText.includes('2012-01-06')) return '1.1';

            console.warn('Unable to detect C-CDA version', versionInfo);
            return 'unknown';
            
        } catch (error) {
            console.error('Error detecting C-CDA version:', error);
            return 'unknown';
        }
    }

    /**
     * Extract detailed version information from document
     * @param {Document} document - XML document
     * @returns {Object} - Detailed version information
     */
    static extractVersionInfo(document) {
        try {
            const templateElements = document.querySelectorAll('templateId');
            const versionInfo = {
                ccdaVersion: null,
                templateVersions: [],
                usRealmHeader: null,
                documentTemplates: [],
                sectionTemplates: []
            };

            templateElements.forEach(element => {
                const root = element.getAttribute('root');
                const extension = element.getAttribute('extension');
                
                if (root) {
                    const templateData = {
                        templateId: root,
                        extension: extension || null
                    };

                    versionInfo.templateVersions.push(templateData);

                    // Categorize templates
                    if (root === '2.16.840.1.113883.10.20.22.1.1') {
                        versionInfo.usRealmHeader = templateData;
                    } else if (root.startsWith('2.16.840.1.113883.10.20.22.1.')) {
                        versionInfo.documentTemplates.push(templateData);
                    } else if (root.startsWith('2.16.840.1.113883.10.20.22.2.')) {
                        versionInfo.sectionTemplates.push(templateData);
                    }
                }
            });

            return versionInfo;
        } catch (error) {
            console.error('Error extracting version info:', error);
            return {
                ccdaVersion: null,
                templateVersions: [],
                usRealmHeader: null,
                documentTemplates: [],
                sectionTemplates: []
            };
        }
    }

    /**
     * Validate document version against document type
     * @param {Document|string} document - XML document or string
     * @param {string} documentType - Document type key
     * @returns {Object} - Validation result with status and details
     */
    static validateVersion(document, documentType) {
        const detectedVersion = this.detectVersion(document);
        const versionConfig = this.SUPPORTED_VERSIONS[detectedVersion];
        
        if (!versionConfig) {
            return {
                valid: false,
                version: detectedVersion,
                error: `Unsupported C-CDA version: ${detectedVersion}`,
                supportedVersions: Object.keys(this.SUPPORTED_VERSIONS)
            };
        }

        const isDocumentSupported = versionConfig.supportedDocuments.includes(documentType);
        
        return {
            valid: isDocumentSupported,
            version: detectedVersion,
            documentType: documentType,
            error: isDocumentSupported ? null : 
                `Document type '${documentType}' not supported in C-CDA ${detectedVersion}`,
            supportedDocuments: versionConfig.supportedDocuments,
            versionInfo: versionConfig
        };
    }

    /**
     * Get version metadata
     * @param {string} version - Version string (e.g., '2.1')
     * @returns {Object|null} - Version configuration or null
     */
    static getVersionMetadata(version) {
        return this.SUPPORTED_VERSIONS[version] || null;
    }

    /**
     * Get all supported versions
     * @returns {Array<string>} - Array of supported version strings
     */
    static getSupportedVersions() {
        return Object.keys(this.SUPPORTED_VERSIONS);
    }

    /**
     * Check if version is supported
     * @param {string} version - Version string to check
     * @returns {boolean} - True if supported, false otherwise
     */
    static isVersionSupported(version) {
        return version in this.SUPPORTED_VERSIONS;
    }

    /**
     * Get supported document types for a version
     * @param {string} version - Version string
     * @returns {Array<string>} - Array of supported document type keys
     */
    static getSupportedDocuments(version) {
        const config = this.getVersionMetadata(version);
        return config ? config.supportedDocuments : [];
    }

    /**
     * Compare two versions
     * @param {string} version1 - First version
     * @param {string} version2 - Second version
     * @returns {number} - -1 if version1 < version2, 0 if equal, 1 if version1 > version2
     */
    static compareVersions(version1, version2) {
        const parseVersion = (v) => {
            if (v === 'unknown') return [0, 0];
            return v.split('.').map(Number);
        };

        const v1 = parseVersion(version1);
        const v2 = parseVersion(version2);

        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const num1 = v1[i] || 0;
            const num2 = v2[i] || 0;
            
            if (num1 < num2) return -1;
            if (num1 > num2) return 1;
        }
        
        return 0;
    }

    /**
     * Get latest supported version
     * @returns {string} - Latest version string
     */
    static getLatestVersion() {
        const versions = this.getSupportedVersions()
            .filter(v => v !== 'unknown')
            .sort((a, b) => this.compareVersions(b, a));
        return versions[0] || 'unknown';
    }

    /**
     * Check if document uses latest version
     * @param {Document|string} document - XML document or string
     * @returns {boolean} - True if using latest version
     */
    static isLatestVersion(document) {
        const detectedVersion = this.detectVersion(document);
        const latestVersion = this.getLatestVersion();
        return detectedVersion === latestVersion;
    }

    /**
     * Get upgrade recommendations
     * @param {Document|string} document - XML document or string
     * @returns {Object} - Upgrade recommendations
     */
    static getUpgradeRecommendations(document) {
        const currentVersion = this.detectVersion(document);
        const latestVersion = this.getLatestVersion();
        const isUpgradeAvailable = this.compareVersions(currentVersion, latestVersion) < 0;

        if (!isUpgradeAvailable) {
            return {
                upgradeAvailable: false,
                currentVersion: currentVersion,
                latestVersion: latestVersion,
                recommendations: []
            };
        }

        const currentConfig = this.getVersionMetadata(currentVersion);
        const latestConfig = this.getVersionMetadata(latestVersion);
        const recommendations = [];

        if (latestConfig && currentConfig) {
            const newDocuments = latestConfig.supportedDocuments.filter(
                doc => !currentConfig.supportedDocuments.includes(doc)
            );
            
            if (newDocuments.length > 0) {
                recommendations.push(
                    `New document types available: ${newDocuments.join(', ')}`
                );
            }

            recommendations.push(
                `Enhanced template validation and parsing capabilities`
            );
            recommendations.push(
                `Improved clinical data structure support`
            );
        }

        return {
            upgradeAvailable: true,
            currentVersion: currentVersion,
            latestVersion: latestVersion,
            recommendations: recommendations
        };
    }

    /**
     * Generate version compatibility report
     * @param {Document|string} document - XML document or string
     * @param {string} documentType - Document type key
     * @returns {Object} - Comprehensive compatibility report
     */
    static generateCompatibilityReport(document, documentType) {
        const versionInfo = this.extractVersionInfo(
            typeof document === 'string' ? 
                new DOMParser().parseFromString(document, 'text/xml') : 
                document
        );
        
        const detectedVersion = this.detectVersion(document);
        const validation = this.validateVersion(document, documentType);
        const upgradeRecs = this.getUpgradeRecommendations(document);

        return {
            detectedVersion: detectedVersion,
            documentType: documentType,
            validation: validation,
            versionInfo: versionInfo,
            upgradeRecommendations: upgradeRecs,
            templateSummary: {
                totalTemplates: versionInfo.templateVersions.length,
                documentLevelTemplates: versionInfo.documentTemplates.length,
                sectionLevelTemplates: versionInfo.sectionTemplates.length,
                hasUSRealmHeader: !!versionInfo.usRealmHeader
            },
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Extract conformance information
     * @param {Document} document - XML document
     * @returns {Object} - Conformance information
     */
    static extractConformanceInfo(document) {
        try {
            const conformanceInfo = {
                implementationGuides: [],
                conformanceRules: [],
                validationResults: []
            };

            // Look for implementation guide references
            const templateElements = document.querySelectorAll('templateId');
            templateElements.forEach(element => {
                const root = element.getAttribute('root');
                if (root && root.startsWith('2.16.840.1.113883.10.20')) {
                    conformanceInfo.implementationGuides.push({
                        templateId: root,
                        extension: element.getAttribute('extension'),
                        assigningAuthorityName: element.getAttribute('assigningAuthorityName')
                    });
                }
            });

            return conformanceInfo;
        } catch (error) {
            console.error('Error extracting conformance info:', error);
            return { implementationGuides: [], conformanceRules: [], validationResults: [] };
        }
    }
}

// Make available globally
window.VersionTracker = VersionTracker;
console.log('VersionTracker loaded');