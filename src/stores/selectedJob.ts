import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSelectedJobStore = defineStore('selectedJob', () => {
  const selectedJobId = ref<string>('');

  function setSelectedJob(jobId: string) {
    selectedJobId.value = jobId;
  }

  function clearSelectedJob() {
    selectedJobId.value = '';
  }

  return {
    selectedJobId,
    setSelectedJob,
    clearSelectedJob,
  };
});
