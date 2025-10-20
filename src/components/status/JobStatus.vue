<template>
  <div class="status-layout">
    <v-card class="jobs-sidebar" rounded="xl" elevation="2" border>
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
    </v-card>

    <v-card class="status-container" rounded="xl" elevation="0">
      <v-card-title class="d-flex align-center ga-4 pa-6">
        <v-card
          class="header-icon-wrapper"
          color="primary"
          rounded="lg"
          elevation="0"
        >
          <v-icon size="32" color="white">mdi-progress-check</v-icon>
        </v-card>
        <div>
          <div class="text-h4 font-weight-bold gradient-text">Processing Status</div>
          <div class="text-body-2 text-grey mt-1">Monitor your file processing jobs in real-time</div>
        </div>
      </v-card-title>

      <v-card-text class="pa-6">
        <div class="status-content">
          <v-row class="mb-6">
            <v-col cols="12" md="4">
              <v-card rounded="lg" elevation="0" border>
                <v-card-text class="d-flex align-center ga-4">
                  <v-icon size="28" color="primary">mdi-file-clock</v-icon>
                  <div>
                    <div class="text-h5 font-weight-bold">{{ activeJobs }}</div>
                    <div class="text-caption text-grey">Active Jobs</div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card rounded="lg" elevation="0" border>
                <v-card-text class="d-flex align-center ga-4">
                  <v-icon size="28" color="success">mdi-check-circle</v-icon>
                  <div>
                    <div class="text-h5 font-weight-bold">{{ completedJobs }}</div>
                    <div class="text-caption text-grey">Completed</div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card rounded="lg" elevation="0" border>
                <v-card-text class="d-flex align-center ga-4">
                  <v-icon size="28" color="info">mdi-chart-line</v-icon>
                  <div>
                    <div class="text-h5 font-weight-bold">{{ overallProgress }}%</div>
                    <div class="text-caption text-grey">Overall Progress</div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-card v-if="processingFiles.length === 0" class="empty-state pa-10 text-center" rounded="lg" elevation="0">
            <v-icon size="80" color="grey-lighten-1">mdi-information-outline</v-icon>
            <div class="text-h6 font-weight-medium mt-4">No active processing jobs</div>
            <div class="text-body-2 text-grey">Upload files to see their processing status here</div>
          </v-card>

          <div v-else class="jobs-list">
            <v-card
              v-for="file in processingFiles"
              :key="file.id"
              rounded="xl"
              elevation="0"
              border
              class="mb-4"
            >
              <v-card-text>
                <div class="d-flex align-center ga-4 mb-4">
                  <v-card
                    class="job-icon"
                    :style="{ background: getStatusGradient(file.status) }"
                    rounded="lg"
                    elevation="0"
                  >
                    <v-icon color="white" size="24">{{ getStatusIcon(file.status) }}</v-icon>
                  </v-card>
                  <div class="flex-grow-1" style="min-width: 0;">
                    <div class="text-h6 font-weight-medium text-truncate">{{ file.name }}</div>
                    <div class="d-flex align-center ga-2 mt-1">
                      <v-chip size="x-small" :color="getStatusColor(file.status)" variant="tonal">
                        {{ file.status.toUpperCase() }}
                      </v-chip>
                      <span v-if="file.jobId" class="text-caption text-grey">Job: {{ file.jobId.slice(0, 12) }}...</span>
                    </div>
                  </div>
                  <v-btn
                    icon="mdi-chevron-down"
                    size="small"
                    variant="text"
                    @click="toggleJobDetails(file.id)"
                  >
                    <v-icon>{{ expandedJobs.includes(file.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  </v-btn>
                </div>

                <div v-if="file.jobId && file.status === 'processing'">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span class="text-body-2 font-weight-medium">Processing</span>
                  </div>
                  <v-progress-linear
                    indeterminate
                    :color="getStatusColor(file.status)"
                    height="8"
                    rounded
                    class="mb-2"
                  ></v-progress-linear>
                  <div v-if="getJob(file.jobId)" class="text-caption text-grey font-italic">
                    {{ getJob(file.jobId)?.message || 'Processing...' }}
                  </div>
                </div>

                <v-expand-transition>
                  <div v-if="expandedJobs.includes(file.id)">
                    <v-divider class="my-4"></v-divider>
                    <v-row>
                      <v-col cols="12" md="4">
                        <div class="d-flex align-start ga-2">
                          <v-icon size="18" color="primary">mdi-identifier</v-icon>
                          <div>
                            <div class="text-caption text-grey text-uppercase font-weight-bold">Job ID</div>
                            <div class="text-body-2">{{ file.jobId }}</div>
                          </div>
                        </div>
                      </v-col>
                      <v-col cols="12" md="4">
                        <div class="d-flex align-start ga-2">
                          <v-icon size="18" color="primary">mdi-calendar</v-icon>
                          <div>
                            <div class="text-caption text-grey text-uppercase font-weight-bold">Started</div>
                            <div class="text-body-2">{{ formatDate(file.uploadedAt) }}</div>
                          </div>
                        </div>
                      </v-col>
                      <v-col cols="12" md="4">
                        <div class="d-flex align-start ga-2">
                          <v-icon size="18" color="primary">mdi-file-multiple</v-icon>
                          <div style="min-width: 0;">
                            <div class="text-caption text-grey text-uppercase font-weight-bold">Files in Job</div>
                            <div class="text-body-2">
                              <v-chip
                                v-for="jobFile in getJobFiles(file.jobId)"
                                :key="jobFile.id"
                                size="x-small"
                                variant="outlined"
                                class="mr-1 mb-1"
                              >
                                {{ jobFile.name }}
                              </v-chip>
                            </div>
                          </div>
                        </div>
                      </v-col>
                    </v-row>

                    <v-alert
                      v-if="file.error"
                      type="error"
                      variant="tonal"
                      rounded="lg"
                      class="mt-4"
                    >
                      {{ file.error }}
                    </v-alert>
                  </div>
                </v-expand-transition>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </v-card-text>
    </v-card>
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

function getJobFiles(jobId: string | undefined) {
  if (!jobId) return [];
  return filesStore.getAllFiles().filter(f => f.jobId === jobId);
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
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(102, 126, 234, 0.2) !important;
}

.v-theme--dark .jobs-sidebar {
  background: rgba(30, 30, 30, 0.9);
  border: 1px solid rgba(102, 126, 234, 0.3) !important;
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

.header-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-content {
  max-width: 1000px;
  width: 100%;
}

.empty-state {
  min-height: 200px;
}

.jobs-list {
  overflow-y: auto;
  max-height: 600px;
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

.job-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .status-layout {
    flex-direction: column;
  }

  .jobs-sidebar {
    width: 100%;
    max-height: 200px;
  }
}
</style>
