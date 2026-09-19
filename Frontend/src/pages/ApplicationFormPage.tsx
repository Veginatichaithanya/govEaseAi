import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_SERVICES } from '../mock/services';
import { authService } from '../mock/auth';
import { applicationService, type ApplicationRecord, type DocumentUpload } from '../mock/applicationService';
import { AlertCircle, Clock, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

// Wizard Layout + Steps
import { WizardLayout } from './application-wizard/WizardLayout';
import { Step1ApplicantInfo } from './application-wizard/steps/Step1ApplicantInfo';
import { Step2BusinessInfo } from './application-wizard/steps/Step2BusinessInfo';
import { Step3ApplicationDetails } from './application-wizard/steps/Step3ApplicationDetails';
import { Step4Documents } from './application-wizard/steps/Step4Documents';
import { Step5AIVerification } from './application-wizard/steps/Step5AIVerification';
import { Step6Review } from './application-wizard/steps/Step6Review';

export const ApplicationFormPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  // Auth
  const currentUser = authService.getCurrentUser();
  const isCitizen = authService.isCitizen();

  // Service lookup
  const service = useMemo(() => MOCK_SERVICES.find((s) => s.id === serviceId), [serviceId]);

  // Wizard State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedDocs, setUploadedDocs] = useState<DocumentUpload[]>([]);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // === GUARD & INITIALIZE === //
  useEffect(() => {
    if (!service || !serviceId) {
      setIsInitializing(false);
      return;
    }

    try {
      const user = authService.getCurrentUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }
      const userId = user.id;

      let app = applicationService.getDraftByUserAndService(userId, serviceId);
      if (!app) {
        const initialFields: Record<string, any> = {
          fullName: user.fullName || user.name || '',
          email: user.email || '',
          state: 'Telangana',
          businessState: 'Telangana'
        };
        app = applicationService.createApplication(userId, serviceId, service.name, initialFields);
      }

      setApplication(app);
      setFormData(app.formData || {});
      setUploadedDocs(app.uploadedDocuments || []);
      setIsInitializing(false);
    } catch (err) {
      console.error('Failed to initialize application:', err);
      setErrorMessage('Failed to initialize application. Please refresh the page.');
      setIsInitializing(false);
    }
  }, [service, serviceId, navigate]);

  // === HANDLERS === //

  const handleFormChange = (data: Record<string, any>) => {
    setFormData(data);
  };

  const handleDocsChange = (docs: DocumentUpload[]) => {
    setUploadedDocs(docs);
    // Persist docs to application record
    if (application) {
      try {
        applicationService.updateDocuments(application.id, docs);
      } catch (err) {
        console.error('Failed to update documents:', err);
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!application) return;
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await new Promise((r) => setTimeout(r, 300));
      const updated = applicationService.saveDraft(application.id, formData);
      setApplication(updated);
      setSuccessMessage('Application draft saved successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Save draft error:', err);
      setErrorMessage('Unable to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (!application) return;

    // Save draft and advance step
    try {
      const updated = applicationService.saveDraft(application.id, formData);
      setApplication(updated);

      if (currentStep === 1) {
        // As per Section 13: Step 1 Continue saves form data, sets currentStep = 2, and navigates to /applications/:id/documents
        applicationService.updateApplicationStep(application.id, 2);
        navigate(`/applications/${application.id}/documents`);
        return;
      }

      applicationService.updateApplicationStep(application.id, currentStep + 1);
    } catch (err) {
      console.error('Silent save error:', err);
    }

    setSuccessMessage(null);
    setErrorMessage(null);
    setCurrentStep((prev) => Math.min(prev + 1, 6));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!application) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Save final form data
      applicationService.saveDraft(application.id, formData);
      // Persist documents
      applicationService.updateDocuments(application.id, uploadedDocs);
      // Submit
      await new Promise((r) => setTimeout(r, 1000)); // Submit animation delay
      const submitted = applicationService.submitApplication(application.id);
      setApplication(submitted);

      // Navigate to application details on success
      navigate(`/applications/${submitted.id}`, { replace: true });
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMessage('Submission failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  // === RENDER GUARDS === //

  if (!isCitizen && currentUser?.role === 'officer') {
    return (
      <DashboardLayout>
        <div style={{ maxWidth: '640px', textAlign: 'center', margin: '4rem auto' }}>
          <div
            className="glass-panel"
            style={{ padding: '3rem 2rem', border: '1px solid rgba(239, 68, 68, 0.35)' }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <Lock size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--heading-color)', marginBottom: '0.75rem' }}>
              Officer Access Restricted
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Application submission is reserved for registered citizen profiles. Officers can review
              submitted applications from the officer portal.
            </p>
            <Link to="/dashboard" className="btn btn-primary">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!service) {
    return (
      <DashboardLayout>
        <div style={{ maxWidth: '600px', textAlign: 'center', margin: '4rem auto' }}>
          <div
            className="glass-panel"
            style={{ padding: '3.5rem 2rem', border: '1px solid rgba(148, 163, 184, 0.2)' }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <AlertCircle size={30} />
            </div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--heading-color)', marginBottom: '0.75rem' }}>
              Service Not Found
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              The government service &quot;{serviceId}&quot; could not be found in the service catalogue.
            </p>
            <Link to="/services" className="btn btn-primary">
              Back to Services
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isInitializing || !application) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', paddingTop: '5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1.5rem 2.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-card)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: '#60A5FA'
            }}
          >
            <Clock size={20} className="animate-spin" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              Loading application...
            </span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // === RENDER WIZARD === //
  return (
    <WizardLayout
      service={service}
      application={application}
      currentStep={currentStep}
      successMessage={successMessage}
      errorMessage={errorMessage}
    >
      {currentStep === 1 && (
        <Step1ApplicantInfo
          formData={formData}
          onChange={handleFormChange}
          onNext={handleNext}
          onSaveDraft={handleSaveDraft}
          isSaving={isSaving}
        />
      )}

      {currentStep === 2 && (
        <Step2BusinessInfo
          formData={formData}
          onChange={handleFormChange}
          onNext={handleNext}
          onBack={handleBack}
          onSaveDraft={handleSaveDraft}
          isSaving={isSaving}
        />
      )}

      {currentStep === 3 && (
        <Step3ApplicationDetails
          formData={formData}
          onChange={handleFormChange}
          onNext={handleNext}
          onBack={handleBack}
          onSaveDraft={handleSaveDraft}
          isSaving={isSaving}
        />
      )}

      {currentStep === 4 && (
        <Step4Documents
          serviceId={serviceId!}
          uploadedDocs={uploadedDocs}
          onDocsChange={handleDocsChange}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 5 && (
        <Step5AIVerification
          formData={formData}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 6 && (
        <Step6Review
          application={application}
          formData={formData}
          uploadedDocs={uploadedDocs}
          onBack={handleBack}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </WizardLayout>
  );
};

export default ApplicationFormPage;
