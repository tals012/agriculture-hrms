"use client";
import { useState, useEffect } from "react";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { BsArrowLeftCircleFill } from 'react-icons/bs';
import AttendanceStepper from "@/containers/attendance/stepper";
import General from "@/containers/attendance/general";
import WorkersAttendance from "@/containers/attendance/workersAttendance";
import Issues from "@/containers/attendance/issues";
import Submit from "@/containers/attendance/submit";
import { ToastContainer } from "react-toastify";
import styles from "@/styles/screens/attendance.module.scss";
import useProfile from "@/hooks/useProfile";
import getGroupMembers from "@/app/(backend)/actions/groups/getGroupMembers";

export default function AttendancePage() {
  const [isWizardStarted, setIsWizardStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState("general");
  const [formData, setFormData] = useState({
    // General step data
    administratorName: "",
    reportDate: new Date(),
    selectedGroup: null,
    selectedPricing: null,
    defaultSchedule: null,
    
    // Workers attendance data
    workersData: {},
    containersFilled: {},
    workersAttendance: [],
    groupWorkers: [],
    
    // Issues data
    selectedIssues: [],
    otherIssueText: "",
  });
  
  const { profile, loading } = useProfile();

  // Fetch group members when group is selected
  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!formData.selectedGroup) return;
      
      try {
        const response = await getGroupMembers({
          groupId: formData.selectedGroup.value,
        });
        
        if (response.status === 200) {
          setFormData(prev => ({
            ...prev,
            groupWorkers: response.data
          }));
        }
      } catch (error) {
        console.error("Error fetching group members:", error);
      }
    };
    
    fetchGroupMembers();
  }, [formData.selectedGroup]);

  const handleStepChange = (step) => {
    setCurrentStep(step);
  };

  const handleStartWizard = () => {
    setIsWizardStarted(true);
    setCurrentStep("general");
  };

  const handleUpdateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'general':
        return (
          <General 
            data={formData} 
            onUpdate={handleUpdateFormData} 
            onStepChange={handleStepChange}
            leaderId={profile?.worker?.id}
          />
        );
      case 'workers-attendance':
        return (
          <WorkersAttendance 
            data={formData} 
            onUpdate={handleUpdateFormData} 
            onStepChange={handleStepChange}
            leaderId={profile?.worker?.id}
          />
        );
      case 'issues':
        return (
          <Issues 
            data={formData} 
            onUpdate={handleUpdateFormData} 
            onStepChange={handleStepChange}
            leaderId={profile?.worker?.id}
          />
        );
      case 'submit':
        return (
          <Submit 
            data={formData} 
            onUpdate={handleUpdateFormData} 
            onStepChange={handleStepChange}
            leaderId={profile?.worker?.id}
          />
        );
      default:
        return null;
    }
  };

  if (!isWizardStarted) {
    return (
      <div className={styles.landingContainer}>
        <div className={styles.landingCard}>
          <h1 className={styles.landingTitle}>דיווח נוכחות ותפוקה יומית של פועלים</h1>
          
          <div className={styles.date}>
            {format(new Date(), 'dd MMMM yyyy', { locale: he })}
          </div>

          <div className={styles.description}>
            <p>בטופס זה יש לדווח נוכחות של ותפוקה של הפועלים בכל יום מחדש.</p>
            <p>יש לענות על השאלות במופיעות בכל קטע.</p>
            <p>תודה על שיתוף הפעולה</p>
          </div>

          <button 
            className={styles.startButton}
            onClick={handleStartWizard}
          >
            <span>התחל עכשיו</span>
            <BsArrowLeftCircleFill className={styles.buttonIcon} />
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>דיווח נוכחות ותפוקה יומית של פועלים</h1>
      <AttendanceStepper
        currentStep={currentStep}
        onStepChange={handleStepChange}
      />
      <div className={styles.content}>
        {renderStepContent()}
      </div>

      <ToastContainer />
    </div>
  );
}
