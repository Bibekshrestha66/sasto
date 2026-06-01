import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, Upload, FileText } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'rejected';
  documents?: string[];
}

interface SellerVerificationProps {
  sellerId: number;
  onVerificationComplete?: () => void;
}

export const SellerVerification: React.FC<SellerVerificationProps> = ({
  sellerId,
  onVerificationComplete,
}) => {
  const [steps, setSteps] = useState<VerificationStep[]>([
    {
      id: 'identity',
      title: 'Identity Verification',
      description: 'Verify your citizenship or passport',
      status: 'pending',
    },
    {
      id: 'address',
      title: 'Address Verification',
      description: 'Confirm your residential address',
      status: 'pending',
    },
    {
      id: 'phone',
      title: 'Phone Verification',
      description: 'Verify your phone number',
      status: 'pending',
    },
    {
      id: 'bank',
      title: 'Bank Account Verification',
      description: 'Link and verify your bank account',
      status: 'pending',
    },
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('stepId', steps[currentStep].id);
      formData.append('sellerId', sellerId.toString());

      const response = await authFetch('/api/verification/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();

      // Update step status
      const newSteps = [...steps];
      newSteps[currentStep].status = 'completed';
      newSteps[currentStep].documents = [data.documentUrl];
      setSteps(newSteps);

      // Move to next step
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onVerificationComplete?.();
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="p-6 border-2 border-dashed border-green-300">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">Seller Verification Progress</h3>
            <span className="text-sm font-semibold text-green-600">
              {completedSteps} of {steps.length} completed
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Verification Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card
            key={step.id}
            className={`p-4 border-2 border-dashed transition-all cursor-pointer ${
              index === currentStep
                ? 'border-green-500 bg-green-50'
                : step.status === 'completed'
                ? 'border-green-300'
                : 'border-gray-300'
            }`}
            onClick={() => step.status === 'completed' && setCurrentStep(index)}
          >
            <div className="flex items-start gap-4">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {step.status === 'completed' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : step.status === 'rejected' ? (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                ) : (
                  <Clock className="w-6 h-6 text-yellow-600" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{step.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                {/* Active Step Upload Area */}
                {index === currentStep && step.status !== 'completed' && (
                  <div className="mt-4">
                    <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:bg-green-50 transition-colors">
                      <div className="flex flex-col items-center">
                        <Upload className="w-6 h-6 text-green-600 mb-2" />
                        <span className="text-sm font-medium text-gray-700">
                          {uploading ? 'Uploading...' : 'Click to upload document'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          PDF, JPG, or PNG (Max 5MB)
                        </span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </label>
                  </div>
                )}

                {/* Completed Step Info */}
                {step.status === 'completed' && step.documents && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Document verified</span>
                  </div>
                )}
              </div>

              {/* Step Number */}
              <div className="text-2xl font-bold text-gray-300">{index + 1}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Completion Message */}
      {completedSteps === steps.length && (
        <Card className="p-6 border-2 border-green-300 bg-green-50">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h4 className="font-bold text-green-900">Verification Complete!</h4>
              <p className="text-sm text-green-700 mt-1">
                Your seller account has been verified. You can now list items with full seller badge.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Help Section */}
      <Card className="p-4 border-2 border-dashed border-gray-300 bg-gray-50">
        <div className="flex gap-3">
          <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-1">Need help with verification?</p>
            <p>
              Ensure all documents are clear, legible, and match the information in your profile.
              Verification typically takes 24-48 hours.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SellerVerification;
