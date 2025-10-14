<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-upload</v-icon>
      Upload Files
    </v-card-title>

    <v-card-text>
      <v-file-input
        v-model="selectedFiles"
        label="Select files"
        multiple
        chips
        :disabled="uploading"
        prepend-icon="mdi-paperclip"
        @update:model-value="handleFileSelection"
      ></v-file-input>

      <v-btn
        color="primary"
        :disabled="selectedFiles.length === 0 || uploading"
        :loading="uploading"
        @click="uploadFiles"
        block
        class="mt-3"
      >
        <v-icon left>mdi-cloud-upload</v-icon>
        Upload {{ selectedFiles.length }} file(s)
      </v-btn>

      <v-divider class="my-4"></v-divider>

      <div v-if="filesStore.getAllFiles().length > 0">
        <h3 class="mb-3">Uploaded Files</h3>
        <v-list>
          <v-list-item
            v-for="file in filesStore.getAllFiles()"
            :key="file.id"
            :class="{ 'bg-green-lighten-5': file.status === 'completed' }"
          >
            <template v-slot:prepend>
              <v-icon :color="getStatusColor(file.status)">
                {{ getStatusIcon(file.status) }}
              </v-icon>
            </template>

            <v-list-item-title>{{ file.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ formatSize(file.size) }} • {{ file.status }}
            </v-list-item-subtitle>

            <template v-slot:append v-if="file.status === 'uploading'">
              <v-progress-circular
                :model-value="file.uploadProgress"
                :size="24"
                :width="3"
                color="primary"
              >
                <small>{{ file.uploadProgress }}</small>
              </v-progress-circular>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFilesStore } from '@/stores/files';
import { useJobsStore } from '@/stores/jobs';

const filesStore = useFilesStore();
const jobsStore = useJobsStore();

const selectedFiles = ref<File[]>([]);
const uploading = ref(false);

function handleFileSelection(files: File | File[] | null) {
  if (!files) {
    selectedFiles.value = [];
  } else if (Array.isArray(files)) {
    selectedFiles.value = files;
  } else {
    selectedFiles.value = [files];
  }
}

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

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    uploading: 'mdi-upload',
    uploaded: 'mdi-check-circle',
    processing: 'mdi-cog',
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
