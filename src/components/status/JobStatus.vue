<template>
  <div class="status-layout">
    <div class="jobs-sidebar">
      <v-list density="compact" class="pa-0">
        <v-list-subheader class="text-uppercase font-weight-bold">
          <v-icon size="small" class="mr-2">mdi-briefcase</v-icon>
          All Jobs ({{ allJobs.length }})
        </v-list-subheader>

        <v-divider></v-divider>

        <div v-if="allJobs.length === 0" class="pa-4 text-center text-grey">
          <v-icon size="48" color="grey-lighten-1">mdi-briefcase-outline</v-icon>
          <p class="text-caption mt-2">No jobs yet</p>
        </div>

        <v-list-item
          v-for="job in allJobs"
          :key="job.id"
          :active="selectedJobId === job.id"
          @click="selectJob(job.id)"
          class="job-list-item"
        >
          <template v-slot:prepend>
            <v-icon :color="getJobIconColor(job.status)">
              {{ getStatusIcon(job.status) }}
            </v-icon>
          </template>

          <v-list-item-title class="text-body-2">
            Job #{{ job.id.slice(-6) }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{ job.status.toUpperCase() }}
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-chip
              v-if="job.status === 'processing'"
              size="x-small"
              color="orange"
              variant="flat"
            >
              {{ job.progress }}%
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <div class="status-container glass-card">
      <div class="section-header">
        <div class="title-with-icon">
          <div class="header-icon-wrapper floating-element">
            <v-icon size="32" color="primary">mdi-progress-check</v-icon>
          </div>
          <h2 class="section-title gradient-text">Processing Status</h2>
        </div>
        <p class="section-subtitle">Monitor your file processing jobs in real-time</p>
      </div>

      <div class="status-content">
      <div class="stats-bar">
        <div class="stat-card">
          <v-icon size="28" color="primary">mdi-file-clock</v-icon>
          <div class="stat-info">
            <p class="stat-value">{{ activeJobs }}</p>
            <p class="stat-label">Active Jobs</p>
          </div>
        </div>
        <div class="stat-card">
          <v-icon size="28" color="success">mdi-check-circle</v-icon>
          <div class="stat-info">
            <p class="stat-value">{{ completedJobs }}</p>
            <p class="stat-label">Completed</p>
          </div>
        </div>
        <div class="stat-card">
          <v-icon size="28" color="info">mdi-chart-line</v-icon>
          <div class="stat-info">
            <p class="stat-value">{{ overallProgress }}%</p>
            <p class="stat-label">Overall Progress</p>
          </div>
        </div>
      </div>

      <div v-if="processingFiles.length === 0" class="empty-state">
        <div class="empty-icon-wrapper">
          <v-icon size="80" color="grey-lighten-1">mdi-information-outline</v-icon>
        </div>
        <p class="empty-title">No active processing jobs</p>
        <p class="empty-subtitle">Upload files to see their processing status here</p>
      </div>

      <div v-else class="jobs-list">
        <div
          v-for="file in processingFiles"
          :key="file.id"
          class="job-card"
        >
          <div class="job-header">
            <div class="job-icon" :style="{ background: getStatusGradient(file.status) }">
              <v-icon color="white" size="24">{{ getStatusIcon(file.status) }}</v-icon>
            </div>
            <div class="job-main-info">
              <h3 class="job-name">{{ file.name }}</h3>
              <p class="job-meta">
                <v-chip size="x-small" :color="getStatusColor(file.status)" variant="tonal">
                  {{ file.status.toUpperCase() }}
                </v-chip>
                <span v-if="file.jobId" class="job-id">Job: {{ file.jobId.slice(0, 12) }}...</span>
              </p>
            </div>
            <v-btn
              icon
              size="small"
              variant="text"
              @click="toggleJobDetails(file.id)"
            >
              <v-icon>{{ expandedJobs.includes(file.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
          </div>

          <div v-if="file.jobId" class="job-progress">
            <div class="progress-info">
              <span class="progress-label">Processing</span>
              <span class="progress-value">{{ getJobProgress(file.jobId) }}%</span>
            </div>
            <v-progress-linear
              :model-value="getJobProgress(file.jobId)"
              :color="getStatusColor(file.status)"
              height="8"
              rounded
              class="custom-progress"
            ></v-progress-linear>
            <p v-if="getJob(file.jobId)" class="progress-message">
              {{ getJob(file.jobId)?.message || 'Processing...' }}
            </p>
          </div>

          <v-expand-transition>
            <div v-if="expandedJobs.includes(file.id)" class="job-details">
              <div class="details-grid">
                <div class="detail-item">
                  <v-icon size="18" color="primary" class="mr-2">mdi-identifier</v-icon>
                  <div class="detail-content">
                    <p class="detail-label">Job ID</p>
                    <p class="detail-value">{{ file.jobId }}</p>
                  </div>
                </div>
                <div class="detail-item">
                  <v-icon size="18" color="primary" class="mr-2">mdi-calendar</v-icon>
                  <div class="detail-content">
                    <p class="detail-label">Started</p>
                    <p class="detail-value">{{ formatDate(file.uploadedAt) }}</p>
                  </div>
                </div>
                <div class="detail-item">
                  <v-icon size="18" color="primary" class="mr-2">mdi-file-key</v-icon>
                  <div class="detail-content">
                    <p class="detail-label">S3 Key</p>
                    <p class="detail-value text-truncate">{{ file.s3Key }}</p>
                  </div>
                </div>
              </div>

              <v-alert
                v-if="file.error"
                type="error"
                variant="tonal"
                class="error-alert"
              >
                {{ file.error }}
              </v-alert>
            </div>
          </v-expand-transition>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFilesStore } from '@/stores/files';
import { useJobsStore } from '@/stores/jobs';
import type { Job } from '@/types';

const filesStore = useFilesStore();
const jobsStore = useJobsStore();

const selectedJobId = ref<string | null>(null);
const expandedJobs = ref<string[]>([]);

const allJobs = computed(() => {
  return Array.from(jobsStore.jobs.values()).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

function selectJob(jobId: string) {
  selectedJobId.value = jobId;
  const file = filesStore.getAllFiles().find(f => f.jobId === jobId);
  if (file && !expandedJobs.value.includes(file.id)) {
    expandedJobs.value.push(file.id);
  }
}

function getJobIconColor(status: string): string {
  const colors: Record<string, string> = {
    uploading: 'blue',
    uploaded: 'cyan',
    processing: 'orange',
    completed: 'green',
    failed: 'red',
  };
  return colors[status] || 'grey';
}

const processingFiles = computed(() =>
  filesStore.getAllFiles().filter(
    (f) => f.status === 'processing' || f.status === 'uploaded'
  )
);

const activeJobs = computed(() => processingFiles.value.length);

const completedJobs = computed(() =>
  filesStore.getAllFiles().filter((f) => f.status === 'completed').length
);

const overallProgress = computed(() => {
  if (processingFiles.value.length === 0) return 100;
  const total = processingFiles.value.reduce((sum, file) => {
    return sum + (file.jobId ? getJobProgress(file.jobId) : 0);
  }, 0);
  return Math.round(total / processingFiles.value.length);
});

function getJob(jobId: string) {
  return jobsStore.getJob(jobId);
}

function getJobProgress(jobId: string): number {
  const job = jobsStore.getJob(jobId);
  return job?.progress || 0;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    uploading: 'blue',
    uploaded: 'cyan',
    processing: 'orange',
    completed: 'green',
    error: 'red',
  };
  return colors[status] || 'grey';
}

function getStatusGradient(status: string): string {
  const gradients: Record<string, string> = {
    uploading: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    uploaded: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    processing: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    completed: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  };
  return gradients[status] || 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    uploading: 'mdi-upload',
    uploaded: 'mdi-check-circle',
    processing: 'mdi-cog-outline',
    completed: 'mdi-check-all',
    error: 'mdi-alert-circle',
  };
  return icons[status] || 'mdi-file';
}

function formatDate(date?: Date): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}

function toggleJobDetails(fileId: string) {
  const index = expandedJobs.value.indexOf(fileId);
  if (index > -1) {
    expandedJobs.value.splice(index, 1);
  } else {
    expandedJobs.value.push(fileId);
  }
}
</script>

<style scoped>
.status-layout {
  display: flex;
  gap: 1.5rem;
  height: calc(100vh - 280px);
  max-height: calc(100vh - 280px);
  overflow: hidden;
}

.jobs-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: white;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  overflow-y: auto;
}

.v-theme--dark .jobs-sidebar {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(255, 255, 255, 0.1);
}

.jobs-sidebar::-webkit-scrollbar {
  width: 6px;
}

.jobs-sidebar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.jobs-sidebar::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 10px;
}

.jobs-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.8);
}

.job-list-item {
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s ease;
}

.v-theme--dark .job-list-item {
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.job-list-item:hover {
  background-color: rgba(102, 126, 234, 0.05);
}

.job-list-item:last-child {
  border-bottom: none;
}

.status-container {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.status-container::-webkit-scrollbar {
  width: 8px;
}

.status-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.status-container::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 10px;
}

.status-container::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.8);
}

.section-header {
  text-align: center;
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.title-with-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.header-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.section-subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

.status-content {
  max-width: 1000px;
  margin: 0 auto;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.v-theme--light .stat-card {
  background: white;
}

.v-theme--dark .stat-card {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(255, 255, 255, 0.1);
}

.stat-card:hover {
  outline: 2px solid #667eea;
  outline-offset: -2px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  line-height: 1;
}

.v-theme--light .stat-value {
  color: #334155;
}

.v-theme--dark .stat-value {
  color: #e2e8f0;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon-wrapper {
  margin-bottom: 1.5rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 0.5rem 0;
}

.empty-subtitle {
  color: #64748b;
  margin: 0;
}

.jobs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  flex: 1;
}

.jobs-list::-webkit-scrollbar {
  width: 8px;
}

.jobs-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.jobs-list::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 10px;
}

.jobs-list::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.8);
}

.job-card {
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.v-theme--light .job-card {
  background: white;
}

.v-theme--dark .job-card {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(255, 255, 255, 0.1);
}

.job-card:hover {
  outline: 2px solid #667eea;
  outline-offset: -2px;
}

.job-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.job-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.job-main-info {
  flex: 1;
  min-width: 0;
}

.job-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 0.5rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.job-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
}

.job-id {
  font-size: 0.8125rem;
  color: #64748b;
}

.job-progress {
  margin-top: 1rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.progress-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: #667eea;
}

.custom-progress {
  margin-bottom: 0.5rem;
}

.progress-message {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
  font-style: italic;
}

.job-details {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e2e8f0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  align-items: start;
  gap: 0.5rem;
}

.detail-content {
  flex: 1;
  min-width: 0;
}

.detail-label {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0 0 0.25rem 0;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 0.875rem;
  color: #334155;
  margin: 0;
  word-break: break-all;
}

.error-alert {
  border-radius: 12px;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .status-layout {
    flex-direction: column;
  }

  .jobs-sidebar {
    width: 100%;
    max-height: 200px;
  }

  .status-container {
    padding: 1.5rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .stats-bar {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
