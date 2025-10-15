<template>
  <div class="data-editor-layout">
    <div class="jobs-sidebar">
      <v-list density="compact" class="pa-0">
        <v-list-subheader class="text-uppercase font-weight-bold">
          <v-icon size="small" class="mr-2">mdi-briefcase</v-icon>
          Jobs ({{ completedJobs.length }})
        </v-list-subheader>

        <v-divider></v-divider>

        <div v-if="completedJobs.length === 0" class="pa-4 text-center text-grey">
          <v-icon size="48" color="grey-lighten-1">mdi-briefcase-outline</v-icon>
          <p class="text-caption mt-2">No jobs completed yet</p>
        </div>

        <v-list-item
          v-for="job in completedJobs"
          :key="job.id"
          :active="selectedJobId === job.id"
          @click="selectJob(job.id)"
          class="job-list-item"
        >
          <template v-slot:prepend>
            <v-icon :color="selectedJobId === job.id ? 'primary' : 'success'">
              mdi-check-circle
            </v-icon>
          </template>

          <v-list-item-title class="text-body-2">
            Job #{{ job.id.slice(-6) }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{ job.message || 'Completed' }}
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-badge
              v-if="hasJobModifications(job.id)"
              color="warning"
              dot
              inline
            ></v-badge>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <div class="files-sidebar">
      <v-list density="compact" class="pa-0">
        <v-list-subheader class="text-uppercase font-weight-bold">
          <v-icon size="small" class="mr-2">mdi-file-multiple</v-icon>
          Files ({{ filesList.length }})
        </v-list-subheader>

        <v-divider></v-divider>

        <div v-if="loading" class="pa-4 text-center">
          <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
        </div>

        <div v-else-if="filesList.length === 0" class="pa-4 text-center text-grey">
          <v-icon size="48" color="grey-lighten-1">mdi-file-outline</v-icon>
          <p class="text-caption mt-2">No files found</p>
        </div>

        <v-list-item
          v-for="(file, index) in filesList"
          :key="file.id"
          :active="selectedFileId === file.id"
          @click="selectFile(file.id)"
          class="file-list-item"
        >
          <template v-slot:prepend>
            <v-icon :color="selectedFileId === file.id ? 'primary' : 'grey'">
              mdi-file-document
            </v-icon>
          </template>

          <v-list-item-title class="text-body-2">
            File #{{ index + 1 }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{ getFilePreview(file) }}
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-badge
              v-if="isRowModified(file.id)"
              color="warning"
              dot
              inline
            ></v-badge>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <div class="main-content">
      <v-card class="h-100">
        <v-card-title class="d-flex align-center justify-space-between sticky-header">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-form-textbox</v-icon>
            <span v-if="selectedJobName">{{ selectedJobName }}</span>
            <span v-else class="text-grey">Data Editor</span>
          </div>
          <div class="d-flex align-center gap-2">
            <v-chip
              v-if="hasModifications"
              color="warning"
              size="small"
            >
              {{ modifiedCount }} modified
            </v-chip>
            <v-btn
              color="primary"
              :disabled="!hasModifications || saving"
              :loading="saving"
              @click="saveChanges"
            >
              <v-icon left>mdi-content-save</v-icon>
              Save Changes
            </v-btn>
          </div>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="form-container">
          <div v-if="loading" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <p class="mt-4 text-grey">Loading data...</p>
          </div>

          <div v-else-if="!selectedJobId" class="text-center py-12 text-grey">
            <v-icon size="80" color="grey-lighten-1">mdi-briefcase</v-icon>
            <p class="mt-4 text-h6">Select a job from the sidebar</p>
            <p class="text-body-2">Choose a job to view and edit its files</p>
          </div>

          <div v-else-if="!selectedFileId && filesList.length > 0" class="text-center py-12 text-grey">
            <v-icon size="80" color="grey-lighten-1">mdi-file-document</v-icon>
            <p class="mt-4 text-h6">Select a file</p>
            <p class="text-body-2">Choose a file from the middle sidebar to edit</p>
          </div>

          <div v-else-if="selectedFile" class="file-form">
            <v-alert
              v-if="isRowModified(selectedFile!.id)"
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              This file has unsaved changes
            </v-alert>

            <v-row>
              <v-col
                v-for="column in editableColumns"
                :key="column"
                cols="12"
                md="6"
              >
                <v-text-field
                  :label="formatLabel(column)"
                  :model-value="selectedFile![column]"
                  @update:model-value="(value) => updateCell(selectedFile!.id, column, value)"
                  variant="outlined"
                  density="comfortable"
                  :class="{ 'modified-field': isRowModified(selectedFile!.id) }"
                >
                  <template v-slot:prepend-inner>
                    <v-icon size="small" color="grey">mdi-text</v-icon>
                  </template>
                </v-text-field>
              </v-col>
            </v-row>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useJobsStore } from '@/stores/jobs';
import { useDataStore } from '@/stores/data';
import { useSelectedJobStore } from '@/stores/selectedJob';

const jobsStore = useJobsStore();
const dataStore = useDataStore();
const selectedJobStore = useSelectedJobStore();

const { selectedJobId } = storeToRefs(selectedJobStore);
const selectedFileId = ref<string>('');
const loading = ref(false);
const saving = ref(false);

watch(selectedJobId, (newJobId) => {
  if (newJobId) {
    selectedFileId.value = '';
    loadJobData(newJobId);
  }
});

const selectedJobName = computed(() => {
  if (!selectedJobId.value) return '';
  return `Job #${selectedJobId.value.slice(-6)}`;
});

const completedJobs = computed(() => {
  return Array.from(jobsStore.jobs.values()).filter(j => j.status === 'completed');
});

const tableData = computed(() => {
  if (!selectedJobId.value) return null;
  return dataStore.getTableData(selectedJobId.value);
});

const filesList = computed(() => {
  if (!tableData.value) return [];
  return tableData.value.rows;
});

const selectedFile = computed(() => {
  if (!selectedFileId.value || !tableData.value) return null;
  return tableData.value.rows.find(row => row.id === selectedFileId.value);
});

const editableColumns = computed(() => {
  if (!tableData.value) return [];
  return tableData.value.columns.filter((col) => col !== 'id');
});

const hasModifications = computed(() => {
  if (!tableData.value) return false;
  return tableData.value.modifiedRows.size > 0;
});

const modifiedCount = computed(() => {
  if (!tableData.value) return 0;
  return tableData.value.modifiedRows.size;
});

async function loadJobData(jobId: string) {
  if (!jobId) return;

  loading.value = true;
  try {
    await dataStore.loadData(jobId);
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    loading.value = false;
  }
}

function updateCell(rowId: string, column: string, value: any) {
  if (!selectedJobId.value) return;
  dataStore.updateRow(selectedJobId.value, rowId, { [column]: value });
}

function isRowModified(rowId: string): boolean {
  if (!selectedJobId.value) return false;
  return dataStore.isRowModified(selectedJobId.value, rowId);
}

function selectJob(jobId: string) {
  selectedJobStore.setSelectedJob(jobId);
}

function selectFile(fileId: string) {
  selectedFileId.value = fileId;
}

function formatLabel(column: string): string {
  return column
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getFilePreview(file: any): string {
  const firstCol = editableColumns.value[0];
  if (!firstCol) return 'No data';
  const value = file[firstCol];
  return value ? String(value).substring(0, 30) : 'Empty';
}

function hasJobModifications(jobId: string): boolean {
  const data = dataStore.getTableData(jobId);
  return data ? data.modifiedRows.size > 0 : false;
}

async function saveChanges() {
  if (!selectedJobId.value) return;

  saving.value = true;
  try {
    await dataStore.saveChanges(selectedJobId.value);
  } catch (error) {
    console.error('Failed to save changes:', error);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.data-editor-layout {
  display: flex;
  gap: 1.5rem;
  height: calc(100vh - 280px);
  max-height: calc(100vh - 280px);
  overflow: hidden;
}

.jobs-sidebar,
.files-sidebar {
  width: 220px;
  height: 100%;
  overflow-y: auto;
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 1rem;
  flex-shrink: 0;
}

.v-theme--light .jobs-sidebar,
.v-theme--light .files-sidebar {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}

.v-theme--dark .jobs-sidebar,
.v-theme--dark .files-sidebar {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

.jobs-sidebar::-webkit-scrollbar,
.files-sidebar::-webkit-scrollbar {
  width: 6px;
}

.jobs-sidebar::-webkit-scrollbar-track,
.files-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.jobs-sidebar::-webkit-scrollbar-thumb,
.files-sidebar::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 10px;
}

.jobs-sidebar::-webkit-scrollbar-thumb:hover,
.files-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

.job-list-item,
.file-list-item {
  border-left: 3px solid transparent;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.job-list-item:hover,
.file-list-item:hover {
  background-color: rgba(102, 126, 234, 0.05);
}

.job-list-item.v-list-item--active,
.file-list-item.v-list-item--active {
  border-left-color: #667eea;
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%);
  outline: 2px solid #667eea;
  outline-offset: -2px;
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
}

.v-theme--light .sticky-header {
  background: rgba(255, 255, 255, 0.98);
}

.v-theme--dark .sticky-header {
  background: rgba(15, 23, 42, 0.98);
}

.form-container {
  overflow: auto;
  height: calc(100% - 80px);
  padding: 2rem;
}

.form-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.form-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.form-container::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 10px;
}

.form-container::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.8);
}

.file-form {
  max-width: 1200px;
  margin: 0 auto;
}

.modified-field :deep(.v-field) {
  background-color: rgba(255, 193, 7, 0.1);
}

.h-100 {
  height: 100%;
  backdrop-filter: blur(20px);
  border-radius: 20px;
}

.v-theme--light .h-100 {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}

.v-theme--dark .h-100 {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

@media (max-width: 968px) {
  .data-editor-layout {
    flex-direction: column;
    height: auto;
  }

  .jobs-sidebar,
  .files-sidebar {
    width: 100%;
    max-height: 250px;
  }

  .main-content {
    min-height: 500px;
  }
}
</style>
