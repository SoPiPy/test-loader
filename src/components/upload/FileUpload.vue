<template>
  <div class="upload-container">
    <div class="upload-section glass-card">
      <div class="section-header">
        <div class="title-with-icon">
          <div class="header-icon-wrapper floating-element">
            <v-icon size="32" color="primary">mdi-cloud-upload</v-icon>
          </div>
          <div class="header-text">
            <h2 class="section-title gradient-text">Upload Your Files</h2>
            <p class="section-subtitle">Drag and drop files here or click to browse</p>
          </div>
        </div>
      </div>

      <div class="collapsible-section">
        <div class="collapse-header" @click="showSelectedFiles = !showSelectedFiles">
          <div class="collapse-title">
            <v-icon>{{ showSelectedFiles ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
            <span>Selected Files ({{ selectedFiles.length }})</span>
          </div>
        </div>
        <v-expand-transition>
          <div v-show="showSelectedFiles">
            <v-file-upload
              v-model="selectedFiles"
              accept=".pdf"
              multiple
              show-size
              chips
              color="primary"
              :loading="uploading"
              class="file-upload-area"
            ></v-file-upload>
          </div>
        </v-expand-transition>
      </div>

      <div class="file-types-hint">
        <v-chip size="small" variant="text" prepend-icon="mdi-information-outline">
          Supported format: PDF only
        </v-chip>
      </div>

      <v-btn
        v-if="selectedFiles.length > 0"
        size="large"
        color="primary"
        :disabled="uploading"
        :loading="uploading"
        @click="uploadFiles"
        block
        class="upload-btn"
      >
        <v-icon class="mr-2">mdi-cloud-upload</v-icon>
        Upload {{ selectedFiles.length }} file(s)
      </v-btn>
    </div>

    <div v-if="filesStore.getAllFiles().length > 0" class="files-list-section glass-card">
      <div class="list-header">
        <h3 class="list-title">Uploaded Files</h3>
        <v-chip size="small" color="primary" variant="tonal">
          {{ filesStore.getAllFiles().length }} total
        </v-chip>
      </div>

      <div class="files-grid">
        <div
          v-for="file in paginatedFiles"
          :key="file.id"
          class="file-card"
          :class="`status-${file.status}`"
        >
          <div class="file-card-header">
            <div class="file-icon-wrapper" :style="{ background: getStatusGradient(file.status) }">
              <v-icon color="white" size="24">{{ getStatusIcon(file.status) }}</v-icon>
            </div>
            <div class="file-info">
              <p class="file-name">{{ file.name }}</p>
              <p class="file-meta">{{ formatSize(file.size) }}</p>
            </div>
          </div>

          <div class="file-card-footer">
            <v-chip
              size="small"
              :color="getStatusColor(file.status)"
              variant="tonal"
            >
              {{ file.status }}
            </v-chip>
            <v-progress-circular
              v-if="file.status === 'uploading'"
              :model-value="file.uploadProgress"
              :size="28"
              :width="3"
              color="primary"
            >
              <span class="progress-text">{{ file.uploadProgress }}</span>
            </v-progress-circular>
          </div>

          <div
            v-if="file.status === 'uploading'"
            class="progress-bar"
            :style="{ width: `${file.uploadProgress}%` }"
          ></div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination-wrapper">
        <v-pagination
          v-model="page"
          :length="totalPages"
          :total-visible="5"
          rounded="circle"
        ></v-pagination>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFilesStore } from '@/stores/files';
import { useJobsStore } from '@/stores/jobs';

const filesStore = useFilesStore();
const jobsStore = useJobsStore();

const selectedFiles = ref<File[]>([]);
const uploading = ref(false);
const page = ref(1);
const itemsPerPage = ref(6);
const showSelectedFiles = ref(true);

const paginatedFiles = computed(() => {
  const allFiles = filesStore.getAllFiles();
  const start = (page.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return allFiles.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filesStore.getAllFiles().length / itemsPerPage.value);
});

async function uploadFiles() {
  if (selectedFiles.value.length === 0) return;

  uploading.value = true;

  try {
    const uploadPromises = selectedFiles.value.map(async (file) => {
      const fileId = filesStore.addFile(file);
      await filesStore.uploadFile(fileId, file);

      const uploadedFile = filesStore.getFile(fileId);
      if (uploadedFile?.jobId) {
        jobsStore.startPolling(uploadedFile.jobId);
      }
    });

    await Promise.all(uploadPromises);
    selectedFiles.value = [];
  } catch (error) {
    console.error('Upload failed:', error);
  } finally {
    uploading.value = false;
  }
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
    completed: 'mdi-check-circle',
    error: 'mdi-alert-circle',
  };
  return icons[status] || 'mdi-file';
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
</script>

<style scoped>
.upload-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: calc(100vh - 280px);
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.upload-section {
  padding: 2rem;
  flex-shrink: 0;
}

.section-header {
  text-align: center;
  margin-bottom: 2rem;
}

.title-with-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
}

.header-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 64px;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.section-subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0.25rem 0 0 0;
  line-height: 1.4;
}

.file-upload-area {
  margin-bottom: 1rem;
}

.file-upload-area :deep(.v-file-upload__dropzone) {
  min-height: 200px;
  border: 3px dashed #e2e8f0;
  border-radius: 20px;
  background: rgba(248, 250, 252, 0.5);
  transition: all 0.3s ease;
}

.file-upload-area :deep(.v-file-upload__dropzone:hover) {
  border-color: #cbd5e1;
  background: rgba(248, 250, 252, 0.8);
}

.file-upload-area :deep(.v-file-upload__dropzone--active) {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  transform: scale(1.02);
}

.collapsible-section {
  margin-bottom: 1rem;
}

.collapse-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
}

.collapse-header:hover {
  background: rgba(102, 126, 234, 0.1);
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #667eea;
}

.upload-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #334155;
  margin: 1rem 0 0.5rem 0;
}

.empty-subtitle {
  color: #64748b;
  margin: 0;
}

.file-types-hint {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.upload-btn {
  margin-top: 1.5rem;
  padding: 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
}

.files-list-section {
  padding: 2rem;
  flex-shrink: 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.list-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.v-theme--light .list-title {
  color: #334155;
}

.v-theme--dark .list-title {
  color: #e2e8f0;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.file-card {
  position: relative;
  border-radius: 16px;
  padding: 1.25rem;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  overflow: hidden;
}

.v-theme--light .file-card {
  background: white;
}

.v-theme--dark .file-card {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(255, 255, 255, 0.1);
}

.file-card:hover {
  outline: 2px solid #667eea;
  outline-offset: -2px;
}

.file-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.file-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 600;
  color: #334155;
  margin: 0 0 0.25rem 0;
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  color: #64748b;
  font-size: 0.8125rem;
  margin: 0;
}

.file-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-text {
  font-size: 0.625rem;
  font-weight: 600;
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .upload-section,
  .files-list-section {
    padding: 1.5rem;
  }

  .drop-zone {
    padding: 2rem 1rem;
    min-height: 250px;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .files-grid {
    grid-template-columns: 1fr;
  }
}
</style>
