/**
 * CCD Parser - Pure JavaScript implementation
 */

class CCDParser {
    constructor() {
        // XML parsing is delegated to the main process via IPC
    }

    /**
     * Parse CCD/CDA XML content
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
                throw new Error('Invalid CCD/CDA document: Missing ClinicalDocument root element');
            }

            const document = result.ClinicalDocument;
            
            return {
                header: this.parseHeader(document),
                patient: this.parsePatient(document),
                allergies: this.parseAllergies(document),
                medications: this.parseMedications(document),
                problems: this.parseProblems(document),
                procedures: this.parseProcedures(document),
                encounters: this.parseEncounters(document),
                immunizations: this.parseImmunizations(document),
                vitalSigns: this.parseVitalSigns(document),
                labResults: this.parseLabResults(document),
                socialHistory: this.parseSocialHistory(document),
                functionalStatus: this.parseFunctionalStatus(document),
                planOfCare: this.parsePlanOfCare(document),
                notes: this.parseNotes(document),
                advanceDirectives: this.parseAdvanceDirectives(document),
                assessment: this.parseAssessment(document),
                chiefComplaint: this.parseChiefComplaint(document),
                familyHistory: this.parseFamilyHistory(document),
                goals: this.parseGoals(document),
                healthConcerns: this.parseHealthConcerns(document),
                instructions: this.parseInstructions(document),
                medicalEquipment: this.parseMedicalEquipment(document),
                mentalStatus: this.parseMentalStatus(document),
                nutrition: this.parseNutrition(document),
                payers: this.parsePayers(document),
                physicalExam: this.parsePhysicalExam(document),
                reasonForVisit: this.parseReasonForVisit(document),
                reviewOfSystems: this.parseReviewOfSystems(document),
                raw: document
            };
        } catch (error) {
            console.error('CCD Parsing error:', error);
            throw new Error(`Failed to parse CCD document: ${error.message}`);
        }
    }

    parseHeader(document) {
        return {
            id: this.extractValue(document.id, '@_root'),
            title: this.extractValue(document.title),
            effectiveTime: this.extractValue(document.effectiveTime, '@_value'),
            confidentialityCode: this.extractValue(document.confidentialityCode, '@_code'),
            languageCode: this.extractValue(document.languageCode, '@_code'),
            setId: this.extractValue(document.setId, '@_root'),
            versionNumber: this.extractValue(document.versionNumber, '@_value'),
            author: this.parseAuthor(document.author)
        };
    }

    parseAuthor(author) {
        if (!author) return null;
        
        const assignedAuthor = author.assignedAuthor;
        if (!assignedAuthor) return null;

        return {
            id: this.extractValue(assignedAuthor.id, '@_root'),
            name: this.parseName(assignedAuthor.assignedPerson?.name),
            organization: this.parseOrganization(assignedAuthor.representedOrganization)
        };
    }

    parsePatient(document) {
        const patientRole = document.recordTarget?.patientRole;
        if (!patientRole) return null;

        const patient = patientRole.patient;
        if (!patient) return null;

        return {
            id: this.extractValue(patientRole.id, '@_root'),
            mrn: this.extractValue(patientRole.id, '@_extension'),
            name: this.parseName(patient.name),
            gender: this.extractValue(patient.administrativeGenderCode, '@_code'),
            dateOfBirth: this.extractValue(patient.birthTime, '@_value'),
            race: this.extractValue(patient.raceCode, '@_displayName'),
            ethnicity: this.extractValue(patient.ethnicGroupCode, '@_displayName'),
            language: this.extractValue(patient.languageCommunication?.languageCode, '@_code'),
            addresses: this.parseAddresses(patientRole.addr),
            telecom: this.parseTelecom(patientRole.telecom),
            maritalStatus: this.extractValue(patient.maritalStatusCode, '@_displayName'),
            guardians: this.parseGuardians(patient.guardian)
        };
    }

    parseAllergies(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.6.1');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const observation = entry.act?.entryRelationship?.observation;
            if (!observation) return null;

            const participant = observation.participant?.[0];
            const allergen = participant?.participantRole?.playingEntity;

            return {
                id: this.extractValue(observation.id, '@_root'),
                substance: this.extractValue(allergen?.code, '@_displayName') || 
                          this.extractValue(allergen?.name),
                reaction: this.extractReactions(observation.entryRelationship),
                severity: this.extractSeverity(observation.entryRelationship),
                status: this.extractValue(observation.statusCode, '@_code'),
                onsetDate: this.extractValue(observation.effectiveTime?.low, '@_value'),
                notes: this.extractValue(observation.text)
            };
        }).filter(Boolean);
    }

    parseMedications(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.1.1');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const substanceAdmin = entry.substanceAdministration;
            if (!substanceAdmin) return null;

            const medication = substanceAdmin.consumable?.manufacturedProduct?.manufacturedMaterial;

            return {
                id: this.extractValue(substanceAdmin.id, '@_root'),
                name: this.extractValue(medication?.code, '@_displayName') ||
                      this.extractValue(medication?.name),
                genericName: this.extractValue(medication?.name),
                dosage: this.extractDosage(substanceAdmin),
                frequency: this.extractFrequency(substanceAdmin.effectiveTime),
                route: this.extractValue(substanceAdmin.routeCode, '@_displayName'),
                status: this.extractValue(substanceAdmin.statusCode, '@_code'),
                startDate: this.extractValue(substanceAdmin.effectiveTime?.low, '@_value'),
                endDate: this.extractValue(substanceAdmin.effectiveTime?.high, '@_value'),
                prescriber: this.extractPrescriber(substanceAdmin.author),
                instructions: this.extractValue(substanceAdmin.text),
                refills: this.extractValue(substanceAdmin.repeatNumber, '@_value')
            };
        }).filter(Boolean);
    }

    parseProblems(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.5.1');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const observation = entry.act?.entryRelationship?.observation;
            if (!observation) return null;

            return {
                id: this.extractValue(observation.id, '@_root'),
                problem: this.extractValue(observation.value, '@_displayName'),
                code: this.extractValue(observation.value, '@_code'),
                codeSystem: this.extractValue(observation.value, '@_codeSystem'),
                status: this.extractValue(observation.statusCode, '@_code'),
                onsetDate: this.extractValue(observation.effectiveTime?.low, '@_value'),
                resolvedDate: this.extractValue(observation.effectiveTime?.high, '@_value'),
                severity: this.extractSeverity(observation.entryRelationship),
                notes: this.extractValue(observation.text)
            };
        }).filter(Boolean);
    }

    parseProcedures(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.7.1');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const procedure = entry.procedure;
            if (!procedure) return null;

            return {
                id: this.extractValue(procedure.id, '@_root'),
                name: this.extractValue(procedure.code, '@_displayName'),
                code: this.extractValue(procedure.code, '@_code'),
                date: this.extractValue(procedure.effectiveTime, '@_value'),
                status: this.extractValue(procedure.statusCode, '@_code'),
                performer: this.extractPerformer(procedure.performer),
                bodySite: this.extractValue(procedure.targetSiteCode, '@_displayName'),
                notes: this.extractValue(procedure.text)
            };
        }).filter(Boolean);
    }

    parseEncounters(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.22.1');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const encounter = entry.encounter;
            if (!encounter) return null;

            return {
                id: this.extractValue(encounter.id, '@_root'),
                type: this.extractValue(encounter.code, '@_displayName'),
                date: this.extractValue(encounter.effectiveTime, '@_value'),
                provider: this.extractProvider(encounter.performer),
                location: this.extractLocation(encounter.participant),
                reasonForVisit: this.extractReasonForVisit(encounter.entryRelationship),
                discharge: this.extractDischarge(encounter)
            };
        }).filter(Boolean);
    }

    parseImmunizations(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.2.1');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const substanceAdmin = entry.substanceAdministration;
            if (!substanceAdmin) return null;

            const vaccine = substanceAdmin.consumable?.manufacturedProduct?.manufacturedMaterial;

            return {
                id: this.extractValue(substanceAdmin.id, '@_root'),
                vaccine: this.extractValue(vaccine?.code, '@_displayName'),
                date: this.extractValue(substanceAdmin.effectiveTime, '@_value'),
                status: this.extractValue(substanceAdmin.statusCode, '@_code'),
                route: this.extractValue(substanceAdmin.routeCode, '@_displayName'),
                site: this.extractValue(substanceAdmin.approachSiteCode, '@_displayName'),
                lot: this.extractValue(vaccine?.lotNumberText),
                manufacturer: this.extractManufacturer(vaccine),
                performer: this.extractProvider(substanceAdmin.performer)
            };
        }).filter(Boolean);
    }

    parseVitalSigns(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.4.1');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const organizer = entry.organizer;
            if (!organizer) return null;

            const vitals = {};
            const components = Array.isArray(organizer.component) ? 
                organizer.component : [organizer.component];

            components.forEach(comp => {
                const observation = comp?.observation;
                if (!observation) return;

                const code = this.extractValue(observation.code, '@_code');
                const value = this.extractValue(observation.value, '@_value');
                const unit = this.extractValue(observation.value, '@_unit');

                switch (code) {
                    case '8480-6': vitals.systolicBP = { value, unit }; break;
                    case '8462-4': vitals.diastolicBP = { value, unit }; break;
                    case '8867-4': vitals.heartRate = { value, unit }; break;
                    case '9279-1': vitals.respiratoryRate = { value, unit }; break;
                    case '8310-5': vitals.temperature = { value, unit }; break;
                    case '8302-2': vitals.height = { value, unit }; break;
                    case '3141-9': vitals.weight = { value, unit }; break;
                    case '39156-5': vitals.bmi = { value, unit }; break;
                }
            });

            return {
                id: this.extractValue(organizer.id, '@_root'),
                date: this.extractValue(organizer.effectiveTime, '@_value'),
                ...vitals
            };
        }).filter(Boolean);
    }

    parseLabResults(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.3.1');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const organizer = entry.organizer;
            if (!organizer) return null;

            const results = [];
            const components = Array.isArray(organizer.component) ? 
                organizer.component : [organizer.component];

            components.forEach(comp => {
                const observation = comp?.observation;
                if (!observation) return;

                results.push({
                    test: this.extractValue(observation.code, '@_displayName'),
                    value: this.extractValue(observation.value, '@_value'),
                    unit: this.extractValue(observation.value, '@_unit'),
                    referenceRange: this.extractValue(observation.referenceRange?.observationRange?.text),
                    status: this.extractValue(observation.statusCode, '@_code'),
                    date: this.extractValue(observation.effectiveTime, '@_value')
                });
            });

            return {
                id: this.extractValue(organizer.id, '@_root'),
                panel: this.extractValue(organizer.code, '@_displayName'),
                date: this.extractValue(organizer.effectiveTime, '@_value'),
                results
            };
        }).filter(Boolean);
    }

    parseSocialHistory(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.17');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const observation = entry.observation;
            if (!observation) return null;

            return {
                id: this.extractValue(observation.id, '@_root'),
                type: this.extractValue(observation.code, '@_displayName'),
                value: this.extractValue(observation.value, '@_displayName') ||
                       this.extractValue(observation.value),
                status: this.extractValue(observation.statusCode, '@_code'),
                date: this.extractValue(observation.effectiveTime, '@_value')
            };
        }).filter(Boolean);
    }

    parseFunctionalStatus(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.14');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const observation = entry.observation;
            if (!observation) return null;

            return {
                id: this.extractValue(observation.id, '@_root'),
                assessment: this.extractValue(observation.code, '@_displayName'),
                result: this.extractValue(observation.value, '@_displayName'),
                date: this.extractValue(observation.effectiveTime, '@_value'),
                status: this.extractValue(observation.statusCode, '@_code')
            };
        }).filter(Boolean);
    }

    parsePlanOfCare(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.10');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const act = entry.act || entry.observation || entry.procedure;
            if (!act) return null;

            return {
                id: this.extractValue(act.id, '@_root'),
                plan: this.extractValue(act.code, '@_displayName'),
                plannedDate: this.extractValue(act.effectiveTime, '@_value'),
                status: this.extractValue(act.statusCode, '@_code'),
                notes: this.extractValue(act.text)
            };
        }).filter(Boolean);
    }

    parseNotes(document) {
        // Try multiple template IDs for notes sections
        const notesTemplateIds = [
            '2.16.840.1.113883.10.20.22.2.65', // Notes Section
            '2.16.840.1.113883.10.20.22.2.12', // Progress Note
            '2.16.840.1.113883.10.20.22.2.56', // Clinical Notes
        ];
        
        let section = null;
        for (const templateId of notesTemplateIds) {
            section = this.findSection(document, templateId);
            if (section) break;
        }
        
        // Also check for sections with LOINC codes for notes
        if (!section) {
            section = this.findSectionByCode(document, ['11488-4', '34109-9', '11506-3']);
        }
        
        if (!section) return [];
        
        const notes = [];
        
        // Extract notes from text element
        if (section.text) {
            const text = this.extractValue(section.text);
            if (text) {
                notes.push({
                    id: 'section-text',
                    type: 'Section Text',
                    content: text,
                    date: this.extractValue(section.effectiveTime, '@_value'),
                    author: 'Unknown'
                });
            }
        }
        
        // Extract notes from entries
        if (section.entry) {
            const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
            
            entries.forEach(entry => {
                const act = entry.act || entry.observation || entry.encounter;
                if (!act) return;
                
                const note = {
                    id: this.extractValue(act.id, '@_root'),
                    type: this.extractValue(act.code, '@_displayName') || 'Clinical Note',
                    content: this.extractValue(act.text),
                    date: this.extractValue(act.effectiveTime, '@_value'),
                    author: this.extractNoteAuthor(act.author),
                    status: this.extractValue(act.statusCode, '@_code')
                };
                
                // Check for additional note content in entryRelationship
                if (act.entryRelationship) {
                    const relationships = Array.isArray(act.entryRelationship) ? 
                        act.entryRelationship : [act.entryRelationship];
                    
                    relationships.forEach(rel => {
                        const obs = rel.observation || rel.act;
                        if (obs?.text) {
                            const additionalText = this.extractValue(obs.text);
                            if (additionalText) {
                                note.content = note.content ? 
                                    `${note.content}\n\n${additionalText}` : additionalText;
                            }
                        }
                    });
                }
                
                if (note.content) {
                    notes.push(note);
                }
            });
        }
        
        return notes;
    }

    parseAdvanceDirectives(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.21.1');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const observation = entry.observation;
            if (!observation) return null;

            return {
                id: this.extractValue(observation.id, '@_root'),
                type: this.extractValue(observation.code, '@_displayName'),
                status: this.extractValue(observation.statusCode, '@_code'),
                effectiveDate: this.extractValue(observation.effectiveTime, '@_value'),
                custodian: this.extractCustodian(observation.participant),
                description: this.extractValue(observation.text)
            };
        }).filter(Boolean);
    }

    parseAssessment(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.8');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const act = entry.act;
            if (!act) return null;

            return {
                id: this.extractValue(act.id, '@_root'),
                assessment: this.extractValue(act.code, '@_displayName'),
                date: this.extractValue(act.effectiveTime, '@_value'),
                clinician: this.extractClinician(act.author),
                findings: this.extractValue(act.text),
                status: this.extractValue(act.statusCode, '@_code')
            };
        }).filter(Boolean);
    }

    parseChiefComplaint(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.13');
        if (!section) return [];

        // Chief complaint is often in section text rather than entries
        const text = this.extractValue(section.text);
        if (!text) return [];

        return [{
            id: 'chief-complaint',
            complaint: text,
            date: this.extractValue(section.effectiveTime, '@_value')
        }];
    }

    parseFamilyHistory(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.15');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const organizer = entry.organizer;
            if (!organizer) return null;

            const subject = organizer.subject?.relatedSubject;
            const observations = this.extractFamilyObservations(organizer.component);

            return {
                id: this.extractValue(organizer.id, '@_root'),
                relationship: this.extractValue(subject?.code, '@_displayName'),
                relativeGender: this.extractValue(subject?.subject?.administrativeGenderCode, '@_displayName'),
                conditions: observations,
                status: this.extractValue(organizer.statusCode, '@_code')
            };
        }).filter(Boolean);
    }

    parseGoals(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.60');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const observation = entry.observation;
            if (!observation) return null;

            return {
                id: this.extractValue(observation.id, '@_root'),
                goal: this.extractValue(observation.text),
                priority: this.extractValue(observation.priorityCode, '@_displayName'),
                targetDate: this.extractValue(observation.effectiveTime?.high, '@_value'),
                status: this.extractValue(observation.statusCode, '@_code'),
                progress: this.extractGoalProgress(observation.entryRelationship)
            };
        }).filter(Boolean);
    }

    parseHealthConcerns(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.58');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const act = entry.act;
            if (!act) return null;

            return {
                id: this.extractValue(act.id, '@_root'),
                concern: this.extractValue(act.text),
                category: this.extractValue(act.code, '@_displayName'),
                status: this.extractValue(act.statusCode, '@_code'),
                date: this.extractValue(act.effectiveTime, '@_value'),
                author: this.extractAuthor(act.author)
            };
        }).filter(Boolean);
    }

    parseInstructions(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.45');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const act = entry.act;
            if (!act) return null;

            return {
                id: this.extractValue(act.id, '@_root'),
                instruction: this.extractValue(act.text),
                code: this.extractValue(act.code, '@_displayName'),
                status: this.extractValue(act.statusCode, '@_code'),
                date: this.extractValue(act.effectiveTime, '@_value')
            };
        }).filter(Boolean);
    }

    parseMedicalEquipment(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.23');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const supply = entry.supply || entry.organizer?.component?.supply;
            if (!supply) return null;

            const device = supply.participant?.participantRole?.playingDevice;

            return {
                id: this.extractValue(supply.id, '@_root'),
                deviceName: this.extractValue(device?.code, '@_displayName'),
                manufacturer: this.extractValue(device?.manufacturerModelName),
                serialNumber: this.extractValue(device?.softwareName),
                implantDate: this.extractValue(supply.effectiveTime, '@_value'),
                status: this.extractValue(supply.statusCode, '@_code')
            };
        }).filter(Boolean);
    }

    parseMentalStatus(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.56');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const observation = entry.observation;
            if (!observation) return null;

            return {
                id: this.extractValue(observation.id, '@_root'),
                assessment: this.extractValue(observation.code, '@_displayName'),
                result: this.extractValue(observation.value, '@_displayName'),
                date: this.extractValue(observation.effectiveTime, '@_value'),
                examiner: this.extractPerformer(observation.performer),
                status: this.extractValue(observation.statusCode, '@_code')
            };
        }).filter(Boolean);
    }

    parseNutrition(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.57');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const observation = entry.observation;
            if (!observation) return null;

            return {
                id: this.extractValue(observation.id, '@_root'),
                dietType: this.extractValue(observation.code, '@_displayName'),
                restrictions: this.extractValue(observation.text),
                calories: this.extractNutritionalValue(observation.entryRelationship, 'calories'),
                protein: this.extractNutritionalValue(observation.entryRelationship, 'protein'),
                date: this.extractValue(observation.effectiveTime, '@_value'),
                status: this.extractValue(observation.statusCode, '@_code')
            };
        }).filter(Boolean);
    }

    parsePayers(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.18');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const act = entry.act;
            if (!act) return null;

            const coverage = act.entryRelationship?.act;
            const payer = coverage?.performer?.assignedEntity?.representedOrganization;

            return {
                id: this.extractValue(act.id, '@_root'),
                payerName: this.extractValue(payer?.name),
                policyNumber: this.extractValue(coverage?.id, '@_extension'),
                groupNumber: this.extractValue(coverage?.participant?.participantRole?.id, '@_extension'),
                policyType: this.extractValue(coverage?.code, '@_displayName'),
                effectiveDate: this.extractValue(coverage?.effectiveTime?.low, '@_value'),
                expirationDate: this.extractValue(coverage?.effectiveTime?.high, '@_value')
            };
        }).filter(Boolean);
    }

    parsePhysicalExam(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.2.10');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const observation = entry.observation;
            if (!observation) return null;

            return {
                id: this.extractValue(observation.id, '@_root'),
                bodySystem: this.extractValue(observation.code, '@_displayName'),
                findings: this.extractValue(observation.text),
                abnormal: this.extractValue(observation.interpretationCode, '@_code') === 'A',
                date: this.extractValue(observation.effectiveTime, '@_value'),
                examiner: this.extractPerformer(observation.performer)
            };
        }).filter(Boolean);
    }

    parseReasonForVisit(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.12');
        if (!section) return [];

        const text = this.extractValue(section.text);
        if (!text) return [];

        return [{
            id: 'reason-for-visit',
            reason: text,
            date: this.extractValue(section.effectiveTime, '@_value')
        }];
    }

    parseReviewOfSystems(document) {
        const section = this.findSection(document, '2.16.840.1.113883.10.20.22.2.44');
        if (!section?.entry) return [];

        const entries = Array.isArray(section.entry) ? section.entry : [section.entry];
        
        return entries.map(entry => {
            const observation = entry.observation;
            if (!observation) return null;

            return {
                id: this.extractValue(observation.id, '@_root'),
                system: this.extractValue(observation.code, '@_displayName'),
                findings: this.extractValue(observation.value, '@_displayName') || this.extractValue(observation.text),
                status: this.extractValue(observation.statusCode, '@_code'),
                date: this.extractValue(observation.effectiveTime, '@_value')
            };
        }).filter(Boolean);
    }
    
    findSectionByCode(document, codes) {
        const component = document.component?.structuredBody?.component;
        if (!component) return null;

        const components = Array.isArray(component) ? component : [component];
        
        return components.find(comp => {
            const section = comp.section;
            if (!section?.code) return false;
            
            const sectionCode = this.extractValue(section.code, '@_code');
            return codes.includes(sectionCode);
        })?.section;
    }
    
    extractNoteAuthor(author) {
        if (!author) return 'Unknown';
        
        const authorArray = Array.isArray(author) ? author[0] : author;
        const assignedAuthor = authorArray?.assignedAuthor;
        
        if (!assignedAuthor) return 'Unknown';
        
        const name = this.parseName(assignedAuthor.assignedPerson?.name);
        const org = this.extractValue(assignedAuthor.representedOrganization?.name);
        
        if (name?.full) {
            return org ? `${name.full} (${org})` : name.full;
        }
        
        return org || 'Unknown';
    }

    // Helper methods
    findSection(document, templateId) {
        const component = document.component?.structuredBody?.component;
        if (!component) return null;

        const components = Array.isArray(component) ? component : [component];
        
        return components.find(comp => {
            const section = comp.section;
            if (!section) return false;
            
            const templates = Array.isArray(section.templateId) ? 
                section.templateId : [section.templateId];
                
            return templates.some(t => t && t['@_root'] === templateId);
        })?.section;
    }

    extractValue(obj, path = null) {
        if (!obj) return null;
        
        if (path) {
            return obj[path] || null;
        }
        
        if (typeof obj === 'string') return obj;
        if (typeof obj === 'object' && obj['#text']) return obj['#text'];
        
        return null;
    }

    parseName(name) {
        if (!name) return null;
        
        const nameObj = Array.isArray(name) ? name[0] : name;
        if (!nameObj) return null;

        const given = nameObj.given;
        const family = nameObj.family;
        
        const firstName = Array.isArray(given) ? given[0] : given;
        const lastName = Array.isArray(family) ? family[0] : family;
        
        return {
            first: this.extractValue(firstName),
            last: this.extractValue(lastName),
            full: `${this.extractValue(firstName) || ''} ${this.extractValue(lastName) || ''}`.trim()
        };
    }

    parseOrganization(org) {
        if (!org) return null;
        
        return {
            name: this.extractValue(org.name),
            address: this.parseAddress(org.addr),
            telecom: this.parseTelecom(org.telecom)
        };
    }

    parseAddresses(addresses) {
        if (!addresses) return [];
        
        const addrs = Array.isArray(addresses) ? addresses : [addresses];
        
        return addrs.map(addr => this.parseAddress(addr)).filter(Boolean);
    }

    parseAddress(addr) {
        if (!addr) return null;
        
        return {
            line: this.extractValue(addr.streetAddressLine),
            city: this.extractValue(addr.city),
            state: this.extractValue(addr.state),
            postalCode: this.extractValue(addr.postalCode),
            country: this.extractValue(addr.country),
            use: this.extractValue(addr, '@_use')
        };
    }

    parseTelecom(telecom) {
        if (!telecom) return [];
        
        const telecoms = Array.isArray(telecom) ? telecom : [telecom];
        
        return telecoms.map(t => ({
            value: this.extractValue(t, '@_value'),
            use: this.extractValue(t, '@_use')
        })).filter(t => t.value);
    }

    parseGuardians(guardians) {
        if (!guardians) return [];
        
        const guardianArray = Array.isArray(guardians) ? guardians : [guardians];
        
        return guardianArray.map(guardian => ({
            name: this.parseName(guardian.guardianPerson?.name),
            relationship: this.extractValue(guardian.code, '@_displayName'),
            telecom: this.parseTelecom(guardian.telecom),
            address: this.parseAddress(guardian.addr)
        })).filter(Boolean);
    }

    // Additional helper methods for complex extractions
    extractReactions(entryRelationships) {
        // Implementation for extracting allergy reactions
        return null;
    }

    extractSeverity(entryRelationships) {
        // Implementation for extracting severity
        return null;
    }

    extractDosage(substanceAdmin) {
        // Implementation for extracting medication dosage
        return null;
    }

    extractFrequency(effectiveTime) {
        // Implementation for extracting frequency
        return null;
    }

    extractPrescriber(author) {
        // Implementation for extracting prescriber info
        return null;
    }

    extractPerformer(performer) {
        // Implementation for extracting procedure performer
        return null;
    }

    extractProvider(performer) {
        // Implementation for extracting provider info
        return null;
    }

    extractLocation(participant) {
        // Implementation for extracting encounter location
        return null;
    }

    extractReasonForVisit(entryRelationship) {
        // Implementation for extracting reason for visit
        return null;
    }

    extractDischarge(encounter) {
        // Implementation for extracting discharge info
        return null;
    }

    extractManufacturer(material) {
        // Implementation for extracting manufacturer
        return null;
    }

    extractCustodian(participant) {
        if (!participant) return 'Unknown';
        
        const participantArray = Array.isArray(participant) ? participant[0] : participant;
        const role = participantArray?.participantRole;
        
        if (!role) return 'Unknown';
        
        const name = this.parseName(role.playingEntity?.name);
        const org = this.extractValue(role.scopingEntity?.name);
        
        if (name?.full) {
            return org ? `${name.full} (${org})` : name.full;
        }
        
        return org || 'Unknown';
    }

    extractClinician(author) {
        if (!author) return 'Unknown';
        
        const authorArray = Array.isArray(author) ? author[0] : author;
        const assignedAuthor = authorArray?.assignedAuthor;
        
        if (!assignedAuthor) return 'Unknown';
        
        const name = this.parseName(assignedAuthor.assignedPerson?.name);
        const org = this.extractValue(assignedAuthor.representedOrganization?.name);
        
        if (name?.full) {
            return org ? `${name.full} (${org})` : name.full;
        }
        
        return org || 'Unknown';
    }

    extractFamilyObservations(components) {
        if (!components) return [];
        
        const compArray = Array.isArray(components) ? components : [components];
        
        return compArray.map(comp => {
            const obs = comp?.observation;
            if (!obs) return null;
            
            return {
                condition: this.extractValue(obs.value, '@_displayName'),
                onsetAge: this.extractValue(obs.entryRelationship?.observation?.value, '@_value'),
                status: this.extractValue(obs.statusCode, '@_code')
            };
        }).filter(Boolean);
    }

    extractGoalProgress(entryRelationship) {
        if (!entryRelationship) return 'Unknown';
        
        const relationArray = Array.isArray(entryRelationship) ? entryRelationship : [entryRelationship];
        const progressEntry = relationArray.find(rel => rel.observation?.code?.['@_code'] === 'ASSERTION');
        
        return this.extractValue(progressEntry?.observation?.value, '@_displayName') || 'Unknown';
    }

    extractAuthor(author) {
        if (!author) return 'Unknown';
        
        const authorArray = Array.isArray(author) ? author[0] : author;
        const assignedAuthor = authorArray?.assignedAuthor;
        
        if (!assignedAuthor) return 'Unknown';
        
        const name = this.parseName(assignedAuthor.assignedPerson?.name);
        const org = this.extractValue(assignedAuthor.representedOrganization?.name);
        
        if (name?.full) {
            return org ? `${name.full} (${org})` : name.full;
        }
        
        return org || 'Unknown';
    }

    extractNutritionalValue(entryRelationships, type) {
        if (!entryRelationships) return 'Unknown';
        
        const relationArray = Array.isArray(entryRelationships) ? entryRelationships : [entryRelationships];
        const nutritionEntry = relationArray.find(rel => 
            rel.observation?.code?.['@_displayName']?.toLowerCase().includes(type.toLowerCase())
        );
        
        const value = this.extractValue(nutritionEntry?.observation?.value, '@_value');
        const unit = this.extractValue(nutritionEntry?.observation?.value, '@_unit');
        
        return value ? `${value} ${unit || ''}`.trim() : 'Unknown';
    }
}

// Export for use in other modules
window.CCDParser = CCDParser;