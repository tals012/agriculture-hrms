"use client";
import { useState } from 'react';
import styles from '@/styles/containers/attendance/stepper.module.scss';
import { MdCheck } from 'react-icons/md';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { BsPeopleFill, BsClipboardDataFill } from 'react-icons/bs';
import { BiErrorCircle } from 'react-icons/bi';
import { IoSendSharp } from 'react-icons/io5';

const steps = [
  {
    id: 'general',
    label: 'כללי',
    icon: IoDocumentTextOutline
  },
  {
    id: 'workers-attendance',
    label: 'נוכחות עובדים', 
    icon: BsClipboardDataFill
  },
  {
    id: 'issues',
    label: 'בעיות',
    icon: BiErrorCircle
  },
  {
    id: 'submit',
    label: 'שליחה',
    icon: IoSendSharp
  }
];

export default function AttendanceStepper({ currentStep, onStepChange }) {
  const handleStepClick = (stepId) => {
    const currentStepIndex = steps.findIndex(s => s.id === currentStep);
    const clickedStepIndex = steps.findIndex(s => s.id === stepId);

    // Only allow moving to completed steps or the next step
    if (clickedStepIndex <= currentStepIndex + 1) {
      onStepChange(stepId);
    }
  };

  return (
    <div className={styles.stepper}>
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
        const isActive = step.id === currentStep;
        
        return (
          <div key={step.id} className={styles.stepContainer}>
            <button
              className={`${styles.step} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
              onClick={() => handleStepClick(step.id)}
              disabled={index > steps.findIndex(s => s.id === currentStep) + 1}
            >
              <div className={styles.iconContainer}>
                {isCompleted ? (
                  <MdCheck className={styles.icon} />
                ) : (
                  <StepIcon className={styles.icon} />
                )}
              </div>
              <span className={styles.label}>{step.label}</span>
            </button>
            {index < steps.length - 1 && (
              <div className={`${styles.connector} ${isCompleted ? styles.completed : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
