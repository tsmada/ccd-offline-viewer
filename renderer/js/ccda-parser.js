/**
 * C-CDA Parser - Extended parser for all C-CDA 2.1 document types
 * Extends the base CCD parser with document type detection and specialized parsing
 */
class CCDAParser extends CCDParser {
    constructor() {
        super();
        this.documentType = null;
        this.sectionRegistry = window.SectionRegistry ? new window.SectionRegistry() : null;
        this.versionTracker = window.VersionTracker || null;
        this.documentTypeDetector = window.DocumentTypeDetector || null;
    }

    /**
     * Parse C-CDA XML content with document type detection
     */
    async parse(xmlContent) {
        try {
            // Use IPC to parse XML in main process
            const parseResult = await window.electronAPI.parseXML(xmlContent);
            
            if (!parseResult.success) {
                throw new Error(parseResult.error);
            }
            
            const result = parseResult.result;
            
            if (!result.ClinicalDocument) {
                throw new Error('Invalid C-CDA document: Missing ClinicalDocument root element');
            }

            const document = result.ClinicalDocument;
            
            // Log the document structure for debugging
            console.log('Document templateId:', document.templateId);
            console.log('Full document structure:', document);
            
            // Detect document type and version
            this.documentType = this.detectDocumentType(document);
            const documentVersion = this.versionTracker ? 
                this.versionTracker.detectVersion(document) : 'unknown';
            
            console.log('Detected document type:', this.documentType);
            console.log('Detected C-CDA version:', documentVersion);

            // Validate document type and version compatibility
            const validation = this.versionTracker ? 
                this.versionTracker.validateVersion(document, this.documentType) : 
                { valid: true };
            if (!validation.valid) {
                console.warn('Document validation warning:', validation.error);
            }

            // Parse base sections (common to all documents) including standard clinical sections
            const allergies = this.parseAllergies(document);
            const medications = this.parseMedications(document);
            const labResults = this.parseLabResults(document);
            const vitalSigns = this.parseVitalSigns(document);
            
            console.log('=== CCDA Parser Results ===');
            console.log('allergies:', allergies);
            console.log('medications:', medications);
            console.log('labResults:', labResults);
            console.log('vitalSigns:', vitalSigns);
            
            const baseParsedData = {
                header: this.parseHeader(document),
                patient: this.parsePatient(document),
                allergies: allergies,
                medications: medications,
                problems: this.parseProblems(document),
                procedures: this.parseProcedures(document),
                encounters: this.parseEncounters(document),
                immunizations: this.parseImmunizations(document),
                vitalSigns: vitalSigns,
                labResults: labResults,
                socialHistory: this.parseSocialHistory(document),
                functionalStatus: this.parseFunctionalStatus(document),
                planOfCare: this.parsePlanOfCare(document),
                notes: this.parseNotes(document),
                sectionMetadata: this.parseSectionMetadata(document),
                raw: document
            };

            // Parse document-type-specific sections
            const documentSpecificSections = this.parseDocumentSpecificSections(document, this.documentType);
            
            // Parse standard clinical sections based on document type
            const standardSections = this.parseStandardSections(document, this.documentType);

            // Combine all parsed data
            const parsedDocument = {
                ...baseParsedData,
                ...standardSections,
                ...documentSpecificSections,
                metadata: {
                    documentType: this.documentType,
                    version: documentVersion,
                    supportedSections: this.sectionRegistry ? 
                        this.sectionRegistry.getSupportedSections(this.documentType) : [],
                    validationResult: validation,
                    parsedAt: new Date().toISOString()
                }
            };

            console.log('=== Final Parsed Document ===');
            console.log('Document keys:', Object.keys(parsedDocument));
            console.log('allergies in final doc:', parsedDocument.allergies);
            console.log('medications in final doc:', parsedDocument.medications);

            return parsedDocument;

        } catch (error) {
            console.error('C-CDA Parsing error:', error);
            throw new Error(`Failed to parse C-CDA document: ${error.message}`);
        }
    }
    
    /**
     * Detect document type from template IDs
     */
    detectDocumentType(document) {
        // Simple detection based on template IDs
        const templateIds = this.extractTemplateIds(document);
        console.log('Extracted template IDs:', templateIds);
        
        // Check for Progress Note
        if (templateIds.includes('2.16.840.1.113883.10.20.22.1.9')) {
            return 'progress';
        }
        
        // Check for CCD
        if (templateIds.includes('2.16.840.1.113883.10.20.22.1.2')) {
            return 'ccd';
        }
        
        // Check for History and Physical
        if (templateIds.includes('2.16.840.1.113883.10.20.22.1.3')) {
            return 'historyPhysical';
        }
        
        // Default to CCD
        return 'ccd';
    }
    
    /**
     * Extract template IDs from document
     */
    extractTemplateIds(document) {
        const templateIds = [];
        
        if (document.templateId) {
            const templates = Array.isArray(document.templateId) ? 
                document.templateId : [document.templateId];
            
            templates.forEach(template => {
                const root = template['@_root'];
                if (root) {
                    templateIds.push(root);
                }
            });
        }
        
        return templateIds;
    }

    /**
     * Parse document-type-specific sections
     */
    parseDocumentSpecificSections(document, documentType) {
        const sections = {};

        switch (documentType) {
            case 'carePlan':
                sections.healthConcerns = this.parseHealthConcerns(document);
                sections.goals = this.parseGoals(document);
                sections.interventions = this.parseInterventions(document);
                break;

            case 'historyPhysical':
                sections.chiefComplaint = this.parseChiefComplaint(document);
                sections.presentIllness = this.parsePresentIllness(document);
                sections.reviewOfSystems = this.parseReviewOfSystems(document);
                sections.physicalExam = this.parsePhysicalExam(document);
                sections.assessment = this.parseAssessment(document);
                break;

            case 'operative':
                sections.preoperativeDx = this.parsePreoperativeDx(document);
                sections.postoperativeDx = this.parsePostoperativeDx(document);
                sections.procedureDescription = this.parseProcedureDescription(document);
                sections.anesthesia = this.parseAnesthesia(document);
                sections.complications = this.parseComplications(document);
                sections.bloodLoss = this.parseBloodLoss(document);
                sections.surgicalSpecimens = this.parseSurgicalSpecimens(document);
                break;

            case 'procedure':
                sections.procedureIndications = this.parseProcedureIndications(document);
                sections.procedureDescription = this.parseProcedureDescription(document);
                sections.procedureFindings = this.parseProcedureFindings(document);
                sections.anesthesia = this.parseAnesthesia(document);
                sections.complications = this.parseComplications(document);
                break;

            case 'dischargeSummary':
                sections.admissionDx = this.parseAdmissionDx(document);
                sections.dischargeDx = this.parseDischargeDx(document);
                sections.hospitalCourse = this.parseHospitalCourse(document);
                sections.dischargeInstructions = this.parseDischargeInstructions(document);
                sections.hospitalConsultations = this.parseHospitalConsultations(document);
                break;

            case 'diagnosticImaging':
                sections.dicomCatalog = this.parseDICOMCatalog(document);
                sections.findings = this.parseFindings(document);
                sections.impressions = this.parseImpressions(document);
                break;

            case 'consultationNote':
                sections.reasonForReferral = this.parseReasonForReferral(document);
                sections.consultationRequest = this.parseConsultationRequest(document);
                sections.recommendations = this.parseRecommendations(document);
                break;

            case 'progress':
                sections.assessment = this.parseAssessment(document);
                sections.planOfTreatment = this.parsePlanOfTreatment(document);
                sections.instructions = this.parseInstructions(document);
                sections.chiefComplaint = this.parseChiefComplaint(document);
                sections.subjectiveData = this.parseSubjectiveData(document);
                sections.objectiveData = this.parseObjectiveData(document);
                sections.physicalExam = this.parsePhysicalExam(document);
                sections.reviewOfSystems = this.parseReviewOfSystems(document);
                break;

            case 'referral':
                sections.referralReason = this.parseReferralReason(document);
                sections.referralRequest = this.parseReferralRequest(document);
                sections.referringProvider = this.parseReferringProvider(document);
                break;

            case 'transfer':
                sections.transferDx = this.parseTransferDx(document);
                sections.transferSummary = this.parseTransferSummary(document);
                sections.receivingProvider = this.parseReceivingProvider(document);
                break;

            case 'ccd':
            default:
                // CCD includes most standard sections, handled in parseStandardSections
                break;
        }

        return sections;
    }

    /**
     * Parse standard clinical sections based on document type support
     */
    parseStandardSections(document, documentType) {
        const sections = {};
        if (!this.sectionRegistry) return sections;
        const supportedSections = this.sectionRegistry.getSupportedSections(documentType);

        supportedSections.forEach(section => {
            if (section.parser && typeof this[section.parser] === 'function') {
                try {
                    sections[section.id] = this[section.parser](document);
                } catch (error) {
                    console.warn(`Error parsing section ${section.id}:`, error);
                    sections[section.id] = null;
                }
            }
        });

        return sections;
    }

    /**
     * Find section by template ID(s) - handles both single strings and arrays
     */
    findSectionFlexible(document, templateIds) {
        if (!templateIds) return null;
        
        const idsToTry = Array.isArray(templateIds) ? templateIds : [templateIds];
        
        for (const templateId of idsToTry) {
            const section = this.findSection(document, templateId);
            if (section) return section;
        }
        
        return null;
    }

    // Document-specific parsing methods

    /**
     * Parse Health Concerns section (Care Plan)
     */
    parseHealthConcerns(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.58');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const act = entry.act;
            if (!act) return null;

            const observation = act.entryRelationship?.observation;
            
            return {
                id: this.extractValue(act.id, '@_root'),
                concern: this.extractValue(observation?.value, '@_displayName') ||
                        this.extractValue(observation?.code, '@_displayName'),
                category: this.extractValue(observation?.code, '@_codeSystemName'),
                status: this.extractValue(act.statusCode, '@_code'),
                date: this.extractValue(act.effectiveTime, '@_value'),
                author: this.parseAuthor(act.author),
                priority: this.extractValue(observation?.priorityCode, '@_displayName'),
                notes: this.extractValue(act.text)
            };
        }).filter(Boolean);
    }

    /**
     * Parse Goals section (Care Plan)
     */
    parseGoals(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.60');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const observation = entry.observation;
            if (!observation) return null;

            return {
                id: this.extractValue(observation.id, '@_root'),
                goal: this.extractValue(observation.value, '@_displayName') ||
                      this.extractValue(observation.code, '@_displayName'),
                priority: this.extractValue(observation.priorityCode, '@_displayName'),
                status: this.extractValue(observation.statusCode, '@_code'),
                targetDate: this.extractValue(observation.effectiveTime?.high, '@_value'),
                startDate: this.extractValue(observation.effectiveTime?.low, '@_value'),
                progress: this.extractValue(observation.value, '@_value'),
                author: this.parseAuthor(observation.author),
                notes: this.extractValue(observation.text)
            };
        }).filter(Boolean);
    }

    /**
     * Parse Interventions section (Care Plan)
     */
    parseInterventions(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.21.2.3');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const act = entry.act;
            if (!act) return null;

            return {
                id: this.extractValue(act.id, '@_root'),
                intervention: this.extractValue(act.code, '@_displayName'),
                status: this.extractValue(act.statusCode, '@_code'),
                plannedDate: this.extractValue(act.effectiveTime?.low, '@_value'),
                completedDate: this.extractValue(act.effectiveTime?.high, '@_value'),
                author: this.parseAuthor(act.author),
                notes: this.extractValue(act.text)
            };
        }).filter(Boolean);
    }

    /**
     * Parse Chief Complaint section
     */
    parseChiefComplaint(document) {
        const section = this.findSectionFlexible(document, ['2.16.840.1.113883.10.20.22.2.13', '1.3.6.1.4.1.19376.1.5.3.1.1.13.2.1']);
        console.log('Chief complaint section found:', !!section);
        if (!section) return null;

        const result = {
            text: this.extractValue(section.text),
            structuredText: this.extractStructuredText(section.text),
            code: this.extractValue(section.code, '@_code'),
            codeSystem: this.extractValue(section.code, '@_codeSystem')
        };
        console.log('Chief complaint parsed:', result);
        return result;
    }

    /**
     * Parse History of Present Illness
     */
    parsePresentIllness(document) {
        const section = this.findSection(document, '1.3.6.1.4.1.19376.1.5.3.1.3.4');
        if (!section) return null;

        return {
            text: this.extractValue(section.text),
            structuredText: this.extractStructuredText(section.text)
        };
    }

    /**
     * Parse Anesthesia section
     */
    parseAnesthesia(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.25');
        if (!section?.entry) return null;

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const procedure = entry.procedure;
            if (!procedure) return null;

            return {
                id: this.extractValue(procedure.id, '@_root'),
                type: this.extractValue(procedure.code, '@_displayName'),
                code: this.extractValue(procedure.code, '@_code'),
                performer: this.parsePerformer(procedure.performer),
                startTime: this.extractValue(procedure.effectiveTime?.low, '@_value'),
                endTime: this.extractValue(procedure.effectiveTime?.high, '@_value'),
                notes: this.extractValue(procedure.text)
            };
        }).filter(Boolean);
    }

    /**
     * Parse Complications section
     */
    parseComplications(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.37');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const observation = entry.observation;
            if (!observation) return null;

            return {
                id: this.extractValue(observation.id, '@_root'),
                complication: this.extractValue(observation.value, '@_displayName') ||
                             this.extractValue(observation.code, '@_displayName'),
                severity: this.extractValue(observation.value?.qualifier?.value, '@_displayName'),
                date: this.extractValue(observation.effectiveTime, '@_value'),
                status: this.extractValue(observation.statusCode, '@_code'),
                notes: this.extractValue(observation.text)
            };
        }).filter(Boolean);
    }

    /**
     * Parse DICOM Object Catalog
     */
    parseDICOMCatalog(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.6.1.1');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const act = entry.act;
            if (!act) return null;

            return {
                id: this.extractValue(act.id, '@_root'),
                studyInstanceUID: this.extractValue(act.id, '@_extension'),
                studyDate: this.extractValue(act.effectiveTime, '@_value'),
                modality: this.extractValue(act.code, '@_displayName'),
                accessionNumber: this.extractValue(act.id?.[1], '@_extension'),
                description: this.extractValue(act.text),
                seriesCount: this.extractSeriesCount(act.entryRelationship),
                imageCount: this.extractImageCount(act.entryRelationship)
            };
        }).filter(Boolean);
    }

    // Utility methods for document-specific parsing

    /**
     * Extract structured text from narrative block
     */
    extractStructuredText(textElement) {
        if (!textElement) return null;
        
        // Handle structured text with lists, paragraphs, etc.
        const content = [];
        
        if (textElement.list) {
            const lists = Array.isArray(textElement.list) ? textElement.list : [textElement.list];
            lists.forEach(list => {
                if (list.item) {
                    const items = Array.isArray(list.item) ? list.item : [list.item];
                    content.push({
                        type: 'list',
                        items: items.map(item => this.extractValue(item))
                    });
                }
            });
        }

        if (textElement.paragraph) {
            const paragraphs = Array.isArray(textElement.paragraph) ? textElement.paragraph : [textElement.paragraph];
            paragraphs.forEach(para => {
                content.push({
                    type: 'paragraph',
                    text: this.extractValue(para)
                });
            });
        }

        return content.length > 0 ? content : null;
    }

    /**
     * Parse performer information
     */
    parsePerformer(performer) {
        if (!performer) return null;
        
        const assignedEntity = performer.assignedEntity;
        if (!assignedEntity) return null;

        return {
            id: this.extractValue(assignedEntity.id, '@_root'),
            name: this.parseName(assignedEntity.assignedPerson?.name),
            role: this.extractValue(performer.functionCode, '@_displayName'),
            organization: this.parseOrganization(assignedEntity.representedOrganization)
        };
    }

    /**
     * Extract series count from DICOM entry relationships
     */
    extractSeriesCount(entryRelationships) {
        if (!entryRelationships) return 0;
        
        const relationships = Array.isArray(entryRelationships) ? entryRelationships : [entryRelationships];
        return relationships.filter(rel => 
            rel.act && rel['@_typeCode'] === 'COMP'
        ).length;
    }

    /**
     * Extract image count from DICOM entry relationships
     */
    extractImageCount(entryRelationships) {
        if (!entryRelationships) return 0;
        
        const relationships = Array.isArray(entryRelationships) ? entryRelationships : [entryRelationships];
        let totalImages = 0;
        
        relationships.forEach(rel => {
            if (rel.act?.entryRelationship) {
                const subRels = Array.isArray(rel.act.entryRelationship) ? 
                    rel.act.entryRelationship : [rel.act.entryRelationship];
                totalImages += subRels.filter(subRel => 
                    subRel.observation && subRel['@_typeCode'] === 'COMP'
                ).length;
            }
        });
        
        return totalImages;
    }

    // Document-specific parsing methods that need implementation
    // These will be implemented in separate specialized parser files

    parsePreoperativeDx(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.22.2.34'); }
    parsePostoperativeDx(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.22.2.35'); }
    parseProcedureDescription(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.22.2.27'); }
    parseBloodLoss(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.18.2.9'); }
    parseSurgicalSpecimens(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.7.13'); }
    parseProcedureIndications(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.22.2.29'); }
    parseProcedureFindings(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.22.2.28'); }
    parseAdmissionDx(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.22.2.43'); }
    parseDischargeDx(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.22.2.24'); }
    parseHospitalCourse(document) { return this.parseGenericSection(document, '1.3.6.1.4.1.19376.1.5.3.1.3.5'); }
    parseDischargeInstructions(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.22.2.41'); }
    parseHospitalConsultations(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.22.2.42'); }
    parseFindings(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.6.1.2'); }
    parseImpressions(document) { return this.parseNarrativeSection(document, 'impressions'); }
    parseReasonForReferral(document) { return this.parseNarrativeSection(document, 'reason for referral'); }
    parseConsultationRequest(document) { return this.parseNarrativeSection(document, 'consultation request'); }
    parseRecommendations(document) { return this.parseNarrativeSection(document, 'recommendations'); }
    parsePlanOfTreatment(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.22.2.10'); }
    parseReferralReason(document) { return this.parseNarrativeSection(document, 'referral reason'); }
    parseReferralRequest(document) { return this.parseNarrativeSection(document, 'referral request'); }
    parseReferringProvider(document) { return this.parseNarrativeSection(document, 'referring provider'); }
    parseTransferDx(document) { return this.parseNarrativeSection(document, 'transfer diagnosis'); }
    parseTransferSummary(document) { return this.parseNarrativeSection(document, 'transfer summary'); }
    parseReceivingProvider(document) { return this.parseNarrativeSection(document, 'receiving provider'); }
    parseInstructions(document) { return this.parseGenericSection(document, '2.16.840.1.113883.10.20.22.2.45'); }
    parseSubjectiveData(document) { 
        const section = this.findSection(document, '2.16.840.1.113883.10.20.21.2.2');
        if (!section) return null;
        
        return {
            title: this.extractValue(section.title) || 'Subjective Data',
            text: this.extractValue(section.text),
            structuredText: this.extractStructuredText(section.text),
            code: this.extractValue(section.code, '@_code'),
            codeSystem: this.extractValue(section.code, '@_codeSystem')
        };
    }
    
    parseObjectiveData(document) { 
        const section = this.findSection(document, '2.16.840.1.113883.10.20.21.2.1');
        if (!section) return null;
        
        return {
            title: this.extractValue(section.title) || 'Objective Data',
            text: this.extractValue(section.text),
            structuredText: this.extractStructuredText(section.text),
            code: this.extractValue(section.code, '@_code'),
            codeSystem: this.extractValue(section.code, '@_codeSystem')
        };
    }

    /**
     * Parse Review of Systems section (flexible template IDs)
     */
    parseReviewOfSystems(document) {
        const section = this.findSectionFlexible(document, ['2.16.840.1.113883.10.20.22.2.44', '1.3.6.1.4.1.19376.1.5.3.1.3.18']);
        if (!section) return null;

        return {
            title: this.extractValue(section.title),
            text: this.extractValue(section.text),
            structuredText: this.extractStructuredText(section.text),
            code: this.extractValue(section.code, '@_code'),
            codeSystem: this.extractValue(section.code, '@_codeSystem')
        };
    }

    /**
     * Parse Assessment section (flexible template IDs)
     */
    parseAssessment(document) {
        const section = this.findSectionFlexible(document, ['2.16.840.1.113883.10.20.22.2.9', '2.16.840.1.113883.10.20.22.2.8']);
        if (!section) return null;

        return {
            title: this.extractValue(section.title),
            text: this.extractValue(section.text),
            structuredText: this.extractStructuredText(section.text),
            code: this.extractValue(section.code, '@_code'),
            codeSystem: this.extractValue(section.code, '@_codeSystem')
        };
    }

    /**
     * Generic section parser for simple narrative sections
     */
    parseGenericSection(document, templateId) {
        const section = this.findSection(document, templateId);
        if (!section) return null;

        return {
            title: this.extractValue(section.title),
            text: this.extractValue(section.text),
            structuredText: this.extractStructuredText(section.text),
            code: this.extractValue(section.code, '@_code'),
            codeSystem: this.extractValue(section.code, '@_codeSystem')
        };
    }

    /**
     * Parse narrative sections by title matching
     */
    parseNarrativeSection(document, sectionTitle) {
        const sections = document.component?.structuredBody?.component;
        if (!sections) return null;

        const sectionArray = Array.isArray(sections) ? sections : [sections];
        const matchingSection = sectionArray.find(comp => {
            const title = this.extractValue(comp.section?.title)?.toLowerCase();
            return title && title.includes(sectionTitle.toLowerCase());
        });

        if (!matchingSection?.section) return null;

        const section = matchingSection.section;
        return {
            title: this.extractValue(section.title),
            text: this.extractValue(section.text),
            structuredText: this.extractStructuredText(section.text)
        };
    }
}

// Make available globally
window.CCDAParser = CCDAParser;
console.log('CCDAParser loaded');