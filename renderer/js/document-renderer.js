/**
 * Document Renderer - Handles rendering of document-specific sections
 */
class DocumentRenderer {
    constructor() {
        this.formatters = new DataFormatters();
    }

    /**
     * Render section based on section ID and document type
     */
    renderSection(sectionId, data, documentType) {
        if (!data) {
            return this.renderNoData(`No ${sectionId} documented`);
        }

        switch (sectionId) {
            // Care Plan sections
            case 'healthConcerns':
                return this.renderHealthConcerns(data);
            case 'goals':
                return this.renderGoals(data);
            case 'interventions':
                return this.renderInterventions(data);
            
            // Clinical assessment sections
            case 'chiefComplaint':
                return this.renderChiefComplaint(data);
            case 'presentIllness':
                return this.renderPresentIllness(data);
            case 'reviewOfSystems':
                return this.renderReviewOfSystems(data);
            case 'physicalExam':
                return this.renderPhysicalExam(data);
            
            // Surgical sections
            case 'preoperativeDx':
                return this.renderPreoperativeDx(data);
            case 'postoperativeDx':
                return this.renderPostoperativeDx(data);
            case 'anesthesia':
                return this.renderAnesthesia(data);
            case 'complications':
                return this.renderComplications(data);
            case 'bloodLoss':
                return this.renderBloodLoss(data);
            case 'surgicalSpecimens':
                return this.renderSurgicalSpecimens(data);
            
            // Hospital sections
            case 'admissionDx':
                return this.renderAdmissionDx(data);
            case 'dischargeDx':
                return this.renderDischargeDx(data);
            case 'hospitalCourse':
                return this.renderHospitalCourse(data);
            case 'hospitalConsultations':
                return this.renderHospitalConsultations(data);
            
            // Diagnostic imaging sections
            case 'dicomCatalog':
                return this.renderDICOMCatalog(data);
            case 'findings':
                return this.renderFindings(data);
            case 'impressions':
                return this.renderImpressions(data);
            
            // Consultation sections
            case 'reasonForReferral':
                return this.renderReasonForReferral(data);
            case 'recommendations':
                return this.renderRecommendations(data);
            
            // Progress sections
            case 'planOfTreatment':
                return this.renderPlanOfTreatment(data);
            case 'instructions':
                return this.renderInstructions(data);
            
            // Procedure sections
            case 'procedureIndications':
                return this.renderProcedureIndications(data);
            case 'procedureFindings':
                return this.renderProcedureFindings(data);
            
            // Referral sections
            case 'referralReason':
                return this.renderReferralReason(data);
            case 'referralRequest':
                return this.renderReferralRequest(data);
            
            // Transfer sections
            case 'transferDx':
                return this.renderTransferDx(data);
            case 'transferSummary':
                return this.renderTransferSummary(data);
            
            default:
                return this.renderGenericSection(data);
        }
    }

    /**
     * Render Health Concerns section
     */
    renderHealthConcerns(concerns) {
        if (!concerns || concerns.length === 0) {
            return this.renderNoData('No health concerns documented');
        }

        return `
            <div class="document-section">
                <h3 class="section-title">Health Concerns</h3>
                <div class="health-concerns-container">
                    ${concerns.map(concern => `
                        <div class="health-concern-card">
                            <div class="concern-header">
                                <h4 class="concern-title">${concern.concern || 'Unspecified Concern'}</h4>
                                <span class="status-badge status-${(concern.status || 'unknown').toLowerCase()}">${concern.status || 'Unknown'}</span>
                            </div>
                            <div class="concern-details">
                                <div class="detail-row">
                                    <span class="label">Category:</span>
                                    <span class="value">${concern.category || 'Not specified'}</span>
                                </div>
                                ${concern.priority ? `
                                    <div class="detail-row">
                                        <span class="label">Priority:</span>
                                        <span class="value priority-${concern.priority.toLowerCase()}">${concern.priority}</span>
                                    </div>
                                ` : ''}
                                ${concern.date ? `
                                    <div class="detail-row">
                                        <span class="label">Date:</span>
                                        <span class="value">${this.formatters.formatDate(concern.date)}</span>
                                    </div>
                                ` : ''}
                                ${concern.author ? `
                                    <div class="detail-row">
                                        <span class="label">Author:</span>
                                        <span class="value">${concern.author.name || 'Unknown'}</span>
                                    </div>
                                ` : ''}
                                ${concern.notes ? `
                                    <div class="concern-notes">
                                        <p>${concern.notes}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Goals section
     */
    renderGoals(goals) {
        if (!goals || goals.length === 0) {
            return this.renderNoData('No goals documented');
        }

        return `
            <div class="document-section">
                <h3 class="section-title">Patient Goals</h3>
                <div class="goals-grid">
                    ${goals.map(goal => `
                        <div class="goal-card">
                            <div class="goal-header">
                                <h4 class="goal-title">${goal.goal || 'Goal'}</h4>
                                ${goal.priority ? `<span class="priority-badge priority-${goal.priority.toLowerCase()}">${goal.priority}</span>` : ''}
                            </div>
                            <div class="goal-progress">
                                ${goal.progress ? `
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${this.calculateProgress(goal.progress)}%"></div>
                                    </div>
                                    <span class="progress-text">${goal.progress}</span>
                                ` : ''}
                            </div>
                            <div class="goal-details">
                                ${goal.targetDate ? `
                                    <div class="detail-row">
                                        <span class="label">Target Date:</span>
                                        <span class="value">${this.formatters.formatDate(goal.targetDate)}</span>
                                    </div>
                                ` : ''}
                                ${goal.startDate ? `
                                    <div class="detail-row">
                                        <span class="label">Start Date:</span>
                                        <span class="value">${this.formatters.formatDate(goal.startDate)}</span>
                                    </div>
                                ` : ''}
                                <div class="detail-row">
                                    <span class="label">Status:</span>
                                    <span class="value status-${(goal.status || 'unknown').toLowerCase()}">${goal.status || 'Unknown'}</span>
                                </div>
                                ${goal.notes ? `
                                    <div class="goal-notes">
                                        <p>${goal.notes}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Interventions section
     */
    renderInterventions(interventions) {
        if (!interventions || interventions.length === 0) {
            return this.renderNoData('No interventions documented');
        }

        return `
            <div class="document-section">
                <h3 class="section-title">Interventions</h3>
                <div class="interventions-list">
                    ${interventions.map(intervention => `
                        <div class="intervention-item">
                            <div class="intervention-header">
                                <h4 class="intervention-title">${intervention.intervention || 'Intervention'}</h4>
                                <span class="status-badge status-${(intervention.status || 'unknown').toLowerCase()}">${intervention.status || 'Unknown'}</span>
                            </div>
                            <div class="intervention-timeline">
                                ${intervention.plannedDate ? `
                                    <div class="timeline-item">
                                        <span class="timeline-label">Planned:</span>
                                        <span class="timeline-date">${this.formatters.formatDate(intervention.plannedDate)}</span>
                                    </div>
                                ` : ''}
                                ${intervention.completedDate ? `
                                    <div class="timeline-item completed">
                                        <span class="timeline-label">Completed:</span>
                                        <span class="timeline-date">${this.formatters.formatDate(intervention.completedDate)}</span>
                                    </div>
                                ` : ''}
                            </div>
                            ${intervention.notes ? `
                                <div class="intervention-notes">
                                    <p>${intervention.notes}</p>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render DICOM Catalog section
     */
    renderDICOMCatalog(dicomData) {
        if (!dicomData || dicomData.length === 0) {
            return this.renderNoData('No DICOM studies documented');
        }

        return `
            <div class="document-section">
                <h3 class="section-title">DICOM Object Catalog</h3>
                <div class="dicom-studies">
                    ${dicomData.map(study => `
                        <div class="dicom-study-card">
                            <div class="study-header">
                                <h4 class="study-title">${study.description || 'Study'}</h4>
                                <span class="modality-badge">${study.modality || 'Unknown'}</span>
                            </div>
                            <div class="study-details">
                                ${study.studyDate ? `
                                    <div class="detail-row">
                                        <span class="label">Study Date:</span>
                                        <span class="value">${this.formatters.formatDate(study.studyDate)}</span>
                                    </div>
                                ` : ''}
                                ${study.accessionNumber ? `
                                    <div class="detail-row">
                                        <span class="label">Accession #:</span>
                                        <span class="value">${study.accessionNumber}</span>
                                    </div>
                                ` : ''}
                                ${study.studyInstanceUID ? `
                                    <div class="detail-row">
                                        <span class="label">Study UID:</span>
                                        <span class="value uid-text">${study.studyInstanceUID}</span>
                                    </div>
                                ` : ''}
                                <div class="detail-row">
                                    <span class="label">Series:</span>
                                    <span class="value">${study.seriesCount || 0}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Images:</span>
                                    <span class="value">${study.imageCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Anesthesia section
     */
    renderAnesthesia(anesthesiaData) {
        if (!anesthesiaData || anesthesiaData.length === 0) {
            return this.renderNoData('No anesthesia information documented');
        }

        return `
            <div class="document-section">
                <h3 class="section-title">Anesthesia</h3>
                <div class="anesthesia-records">
                    ${anesthesiaData.map(record => `
                        <div class="anesthesia-record">
                            <h4 class="anesthesia-type">${record.type || 'Anesthesia'}</h4>
                            <div class="anesthesia-details">
                                ${record.performer ? `
                                    <div class="detail-row">
                                        <span class="label">Anesthesiologist:</span>
                                        <span class="value">${record.performer.name || 'Unknown'}</span>
                                    </div>
                                ` : ''}
                                ${record.startTime && record.endTime ? `
                                    <div class="detail-row">
                                        <span class="label">Duration:</span>
                                        <span class="value">${this.formatters.formatTimeRange(record.startTime, record.endTime)}</span>
                                    </div>
                                ` : ''}
                                ${record.notes ? `
                                    <div class="anesthesia-notes">
                                        <p>${record.notes}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Complications section
     */
    renderComplications(complications) {
        if (!complications || complications.length === 0) {
            return this.renderNoData('No complications documented');
        }

        return `
            <div class="document-section">
                <h3 class="section-title">Complications</h3>
                <div class="complications-list">
                    ${complications.map(complication => `
                        <div class="complication-item">
                            <div class="complication-header">
                                <h4 class="complication-title">${complication.complication || 'Complication'}</h4>
                                ${complication.severity ? `<span class="severity-badge severity-${complication.severity.toLowerCase()}">${complication.severity}</span>` : ''}
                            </div>
                            <div class="complication-details">
                                ${complication.date ? `
                                    <div class="detail-row">
                                        <span class="label">Date:</span>
                                        <span class="value">${this.formatters.formatDate(complication.date)}</span>
                                    </div>
                                ` : ''}
                                <div class="detail-row">
                                    <span class="label">Status:</span>
                                    <span class="value">${complication.status || 'Unknown'}</span>
                                </div>
                                ${complication.notes ? `
                                    <div class="complication-notes">
                                        <p>${complication.notes}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render generic narrative section
     */
    renderGenericSection(data) {
        if (!data) return this.renderNoData('No data available');

        if (typeof data === 'string') {
            return `
                <div class="document-section">
                    <div class="narrative-content">
                        <p>${data}</p>
                    </div>
                </div>
            `;
        }

        if (data.text || data.structuredText) {
            return `
                <div class="document-section">
                    ${data.title ? `<h3 class="section-title">${data.title}</h3>` : ''}
                    <div class="narrative-content">
                        ${data.text ? `<div class="text-content">${data.text}</div>` : ''}
                        ${data.structuredText ? this.renderStructuredText(data.structuredText) : ''}
                    </div>
                </div>
            `;
        }

        return this.renderNoData('No data available');
    }

    /**
     * Render structured text content
     */
    renderStructuredText(structuredText) {
        if (!structuredText || !Array.isArray(structuredText)) return '';

        return structuredText.map(item => {
            switch (item.type) {
                case 'list':
                    return `
                        <ul class="structured-list">
                            ${item.items.map(listItem => `<li>${listItem}</li>`).join('')}
                        </ul>
                    `;
                case 'paragraph':
                    return `<p class="structured-paragraph">${item.text}</p>`;
                default:
                    return `<div class="structured-item">${item.text || ''}</div>`;
            }
        }).join('');
    }

    /**
     * Render no data message
     */
    renderNoData(message) {
        return `
            <div class="document-section">
                <div class="no-data-message">
                    <span class="no-data-icon">📄</span>
                    <p>${message}</p>
                </div>
            </div>
        `;
    }

    /**
     * Calculate progress percentage from text
     */
    calculateProgress(progressText) {
        if (!progressText) return 0;
        
        const matches = progressText.match(/(\d+)%/);
        if (matches) {
            return parseInt(matches[1]);
        }
        
        // Try to extract from common progress phrases
        if (progressText.toLowerCase().includes('complete')) return 100;
        if (progressText.toLowerCase().includes('in progress')) return 50;
        if (progressText.toLowerCase().includes('started')) return 25;
        
        return 0;
    }

    // Placeholder methods for sections not yet implemented
    renderChiefComplaint(data) { return this.renderGenericSection(data); }
    renderPresentIllness(data) { return this.renderGenericSection(data); }
    renderReviewOfSystems(data) { return this.renderGenericSection(data); }
    renderPhysicalExam(data) { return this.renderGenericSection(data); }
    renderPreoperativeDx(data) { return this.renderGenericSection(data); }
    renderPostoperativeDx(data) { return this.renderGenericSection(data); }
    renderBloodLoss(data) { return this.renderGenericSection(data); }
    renderSurgicalSpecimens(data) { return this.renderGenericSection(data); }
    renderAdmissionDx(data) { return this.renderGenericSection(data); }
    renderDischargeDx(data) { return this.renderGenericSection(data); }
    renderHospitalCourse(data) { return this.renderGenericSection(data); }
    renderHospitalConsultations(data) { return this.renderGenericSection(data); }
    renderFindings(data) { return this.renderGenericSection(data); }
    renderImpressions(data) { return this.renderGenericSection(data); }
    renderReasonForReferral(data) { return this.renderGenericSection(data); }
    renderRecommendations(data) { return this.renderGenericSection(data); }
    renderPlanOfTreatment(data) { return this.renderGenericSection(data); }
    renderProcedureIndications(data) { return this.renderGenericSection(data); }
    renderProcedureFindings(data) { return this.renderGenericSection(data); }
    renderReferralReason(data) { return this.renderGenericSection(data); }
    renderReferralRequest(data) { return this.renderGenericSection(data); }
    renderTransferDx(data) { return this.renderGenericSection(data); }
    renderTransferSummary(data) { return this.renderGenericSection(data); }
    renderInstructions(data) { return this.renderGenericSection(data); }
    renderPlannedProcedure(data) { return this.renderGenericSection(data); }
    renderSurgicalDrains(data) { return this.renderGenericSection(data); }
    renderProcedureImplants(data) { return this.renderGenericSection(data); }
    renderProcedureSpecimens(data) { return this.renderGenericSection(data); }
    renderPostprocedureDx(data) { return this.renderGenericSection(data); }
    renderProcedureDisposition(data) { return this.renderGenericSection(data); }
}

/**
 * Data formatting utilities
 */
class DataFormatters {
    formatDate(dateString) {
        if (!dateString) return 'Not specified';
        
        try {
            // Handle CCDA date formats (YYYYMMDD, YYYYMMDDHHMMSS, etc.)
            const cleaned = dateString.replace(/[^\d]/g, '');
            if (cleaned.length >= 8) {
                const year = cleaned.substring(0, 4);
                const month = cleaned.substring(4, 6);
                const day = cleaned.substring(6, 8);
                const date = new Date(year, month - 1, day);
                return date.toLocaleDateString();
            }
            
            // Fallback to regular date parsing
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch (error) {
            return dateString;
        }
    }

    formatTimeRange(startTime, endTime) {
        const start = this.formatDate(startTime);
        const end = this.formatDate(endTime);
        return `${start} - ${end}`;
    }
}

// Make available globally
window.DocumentRenderer = DocumentRenderer;
window.DataFormatters = DataFormatters;
console.log('DocumentRenderer loaded');