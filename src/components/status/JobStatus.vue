<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-progress-check</v-icon>
      Processing Status
      <v-chip class="ml-2" size="small" color="primary">
        {{ activeJobs }} active
      </v-chip>
    </v-card-title>

    <v-card-text>
      <div v-if="processingFiles.length === 0" class="text-center py-8 text-grey">
        <v-icon size="64" color="grey-lighten-1">mdi-information-outline</v-icon>
        <p class="mt-4">No files being processed</p>
      </div>

      <v-expansion-panels v-else>
        <v-expansion-panel
          v-for="file in processingFiles"
          :key="file.id"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center w-100">
              <v-icon :color="getStatusColor(file.status)" class="mr-3">
                {{ getStatusIcon(file.status) }}
              </v-icon>
              <div class="flex-grow-1">
                <div class="font-weight-medium">{{ file.name }}</div>
                <div class="text-caption text-grey">
                  {{ file.status.toUpperCase() }}
                </div>
              </div>
              <v-chip
                v-if="file.jobId"
                size="small"
                variant="outlined"
                class="mr-2"
              >
                Job: {{ file.jobId.slice(0, 8) }}...
              </v-chip>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <div v-if="file.jobId">
              <v-progress-linear
                :model-value="getJobProgress(file.jobId)"
                color="primary"
                height="8"
                rounded
                class="mb-4"
              ></v-progress-linear>

              <v-list density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-identifier</v-icon>
                  </template>
                  <v-list-item-title>Job ID</v-list-item-title>
                  <v-list-item-subtitle>{{ file.jobId }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-calendar</v-icon>
                  </template>
                  <v-list-item-title>Started</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDate(file.uploadedAt) }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="getJob(file.jobId)">
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-information</v-icon>
                  </template>
                  <v-list-item-title>Status</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ getJob(file.jobId)?.message || 'Processing...' }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-file-key</v-icon>
                  </template>
                  <v-list-item-title>S3 Key</v-list-item-title>
                  <v-list-item-subtitle class="text-truncate">
                    {{ file.s3Key }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </div>

            <v-alert
              v-if="file.error"
              type="error"
              variant="tonal"
              class="mt-3"
            >
              {{ file.error }}
            </v-alert>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFilesStore } from '@/stores/files';
import { useJobsStore } from '@/stores/jobs';

const filesStore = useFilesStore();
const jobsStore = useJobsStore();

const processingFiles = computed(() =>
  filesStore.getAllFiles().filter(
    (f) => f.status === 'processing' || f.status === 'uploaded'
  )
);

const activeJobs = computed(() => processingFiles.value.length);

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

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    uploading: 'mdi-upload',
    uploaded: 'mdi-check-circle',
    processing: 'mdi-cog-sync',
    completed: 'mdi-check-all',
    error: 'mdi-alert-circle',
  };
  return icons[status] || 'mdi-file';
}

function formatDate(date?: Date): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}
</script>
