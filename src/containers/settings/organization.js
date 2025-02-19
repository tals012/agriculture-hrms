"use client";

import { useState } from 'react';
import styles from '@/styles/containers/settings/organization.module.scss';
import { toast } from 'react-toastify';
import getWorkers from '@/app/(backend)/actions/workers/getWorkers';

const OrganizationSettings = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncWorkers = async () => {
    try {
      setIsSyncing(true);
      
      // Get all active workers using the existing server action
      const workersData = await getWorkers({ status: 'ACTIVE' });
      
      if (!workersData.data || workersData.status !== 200) {
        throw new Error(workersData.message || 'Failed to fetch workers');
      }

      // Track success and failures
      const results = {
        total: workersData.data.length,
        success: 0,
        failed: 0,
        failedWorkers: []
      };

      // Register each worker
      for (const worker of workersData.data) {
        try {
          const response = await fetch('/api/salary/register-worker', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ workerId: worker.id }),
          });

          if (response.ok) {
            results.success++;
          } else {
            results.failed++;
            results.failedWorkers.push(worker.nameHe || worker.name);
          }
        } catch (error) {
          results.failed++;
          results.failedWorkers.push(worker.nameHe || worker.name);
        }
      }

      // Show results in Hebrew
      if (results.failed === 0) {
        toast.success(`${results.success} עובדים סונכרנו בהצלחה עם מערכת השכר`);
      } else {
        toast.warning(
          `סונכרנו ${results.success} עובדים, אך נכשל סנכרון ${results.failed} עובדים. ` +
          `עובדים שנכשלו: ${results.failedWorkers.join(', ')}`
        );
      }
    } catch (error) {
      console.error('Error syncing workers:', error);
      toast.error('שגיאה בסנכרון העובדים עם מערכת השכר');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>סנכרון מערכת שכר</h2>
        <p className={styles.sectionDescription}>
          סנכרן את כל העובדים הפעילים עם מערכת השכר החיצונית
        </p>
        <button
          className={styles.syncButton}
          onClick={handleSyncWorkers}
          disabled={isSyncing}
        >
          {isSyncing ? 'מסנכרן...' : 'סנכרן עובדים עם מערכת שכר'}
        </button>
      </div>
    </div>
  );
};

export default OrganizationSettings; 