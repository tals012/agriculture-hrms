"use client";
import { useState, useEffect } from "react";
import styles from "@/styles/containers/attendance/issues.module.scss";
import { BsArrowLeft } from "react-icons/bs";
import { toast } from "react-toastify";
import TextField from "@/components/textField";

const issuesList = [
  { id: 'no-comments', label: 'אין הערות' },
  { id: 'rain', label: 'הפרעות גשם' },
  { id: 'no-containers', label: 'חוסר במכלים' },
  { id: 'plot-finished', label: 'סיום חלקה' },
  { id: 'harvest-break', label: 'הפסקת קטיף' },
  { id: 'no-fruits', label: 'אין פירות' },
  { id: 'other', label: 'אחר' },
];

export default function Issues({ data, onUpdate, onStepChange }) {
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [otherText, setOtherText] = useState('');

  useEffect(() => {
    if (data?.selectedIssues) {
      setSelectedIssues(data.selectedIssues);
    }
    if (data?.otherIssueText) {
      setOtherText(data.otherIssueText);
    }
  }, [data]);

  const handleIssueToggle = (issueId) => {
    const newSelection = selectedIssues.includes(issueId)
      ? selectedIssues.filter(id => id !== issueId)
      : [...selectedIssues, issueId];
    
    setSelectedIssues(newSelection);
    onUpdate({ 
      selectedIssues: newSelection,
      otherIssueText: otherText 
    });
  };

  const handleOtherTextChange = (e) => {
    const text = e.target.value;
    setOtherText(text);
    onUpdate({ 
      selectedIssues,
      otherIssueText: text 
    });
  };

  const handleNext = () => {
    if (selectedIssues.includes('other') && !otherText.trim()) {
      toast.error("נא למלא את שדה 'אחר'", {
        position: "top-center",
        autoClose: 3000,
        rtl: true
      });
      return;
    }
    onStepChange('submit');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>בעיות והערות</h2>

      <div className={styles.issuesList}>
        {issuesList.map((issue) => (
          <label key={issue.id} className={styles.issueItem}>
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                checked={selectedIssues.includes(issue.id)}
                onChange={() => handleIssueToggle(issue.id)}
              />
              <span className={styles.checkmark}></span>
            </div>
            <span className={styles.label}>{issue.label}</span>
          </label>
        ))}

        {selectedIssues.includes('other') && (
          <div className={styles.otherInput}>
            <TextField
              label="פירוט"
              width="100%"
              value={otherText}
              onChange={(e) => handleOtherTextChange(e)}
              rows={3}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #E6E6E6',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
              }}
            />
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button onClick={handleNext} className={styles.nextButton}>
          הבא
          <BsArrowLeft size={20} />
        </button>
      </div>
    </div>
  );
}
