import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Job } from '@/types';
import api from '@/services/api';
import { useFilesStore } from './files';

export const useJobsStore = defineStore('jobs', () => {
  const jobs = ref<Map<string, Job>>(new Map());
  const pollingIntervals = ref<Map<string, number>>(new Map());

  function initializeMockJobs() {
    const mockJobsData: Job[] = [
      {
        id: 'job-4',
        fileId: 'file-4',
        status: 'processing',
        progress: 65,
        message: 'Extracting data from file...',
        createdAt: new Date(Date.now() - 300000),
        updatedAt: new Date(Date.now() - 60000),
      },
    ];

    mockJobsData.forEach(job => {
      jobs.value.set(job.id, job);
    });
  }

  async function startPolling(jobId: string) {
    if (pollingIntervals.value.has(jobId)) return;

    const filesStore = useFilesStore();

    const poll = async () => {
      try {
        const job = await api.getJobStatus(jobId);
        jobs.value.set(jobId, job);

        if (job.status === 'completed') {
          filesStore.updateFileStatus(job.fileId, 'completed');
          stopPolling(jobId);
        } else if (job.status === 'failed') {
          filesStore.updateFileStatus(job.fileId, 'error');
          stopPolling(jobId);
        }
      } catch (error) {
        console.error(`Failed to poll job ${jobId}:`, error);
      }
    };

    await poll();
    const intervalId = window.setInterval(poll, 3000);
    pollingIntervals.value.set(jobId, intervalId);
  }

  function stopPolling(jobId: string) {
    const intervalId = pollingIntervals.value.get(jobId);
    if (intervalId) {
      clearInterval(intervalId);
      pollingIntervals.value.delete(jobId);
    }
  }

  function stopAllPolling() {
    pollingIntervals.value.forEach((intervalId) => clearInterval(intervalId));
    pollingIntervals.value.clear();
  }

  function getJob(jobId: string): Job | undefined {
    return jobs.value.get(jobId);
  }

  return {
    jobs,
    startPolling,
    stopPolling,
    stopAllPolling,
    getJob,
    initializeMockJobs,
  };
});
