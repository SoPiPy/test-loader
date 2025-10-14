<template>
  <div class="data-editor-layout">
    <div class="files-sidebar">
      <v-list density="compact" class="pa-0">
        <v-list-subheader class="text-uppercase font-weight-bold">
          <v-icon size="small" class="mr-2">mdi-file-multiple</v-icon>
          Files ({{ completedFiles.length }})
        </v-list-subheader>

        <v-divider></v-divider>

        <div v-if="completedFiles.length === 0" class="pa-4 text-center text-grey">
          <v-icon size="48" color="grey-lighten-1">mdi-file-outline</v-icon>
          <p class="text-caption mt-2">No files processed yet</p>
        </div>

        <v-list-item
          v-for="file in completedFiles"
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
            {{ file.name }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{ formatFileSize(file.size) }}
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-badge
              v-if="hasFileModifications(file.id)"
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
            <v-icon class="mr-2">mdi-table-edit</v-icon>
            <span v-if="selectedFileName">{{ selectedFileName }}</span>
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

        <v-card-text class="table-container">
          <div v-if="loading" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <p class="mt-4 text-grey">Loading data...</p>
          </div>

          <div v-else-if="!selectedFileId" class="text-center py-12 text-grey">
            <v-icon size="80" color="grey-lighten-1">mdi-table</v-icon>
            <p class="mt-4 text-h6">Select a file from the sidebar</p>
            <p class="text-body-2">Choose a file to view and edit its data</p>
          </div>

          <div v-else-if="tableData">
            <v-data-table
              :headers="headers"
              :items="tableData.rows"
              :items-per-page="15"
              class="elevation-0"
              density="comfortable"
            >
              <template v-for="column in editableColumns" v-slot:[`item.${column}`]="{ item }">
                <v-text-field
                  :key="column"
                  :model-value="item[column]"
                  @update:model-value="(value) => updateCell(item.id, column, value)"
                  density="compact"
                  hide-details
                  :class="{ 'bg-yellow-lighten-4': isRowModified(item.id) }"
                ></v-text-field>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-icon
                  v-if="isRowModified(item.id)"
                  color="warning"
                  size="small"
                >
                  mdi-pencil
                </v-icon>
              </template>
            </v-data-table>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFilesStore } from '@/stores/files';
import { useDataStore } from '@/stores/data';

const filesStore = useFilesStore();
const dataStore = useDataStore();

const selectedFileId = ref<string>('');

const selectedFileName = computed(() => {
  if (!selectedFileId.value) return '';
  const file = filesStore.getFile(selectedFileId.value);
  return file?.name || '';
});
const loading = ref(false);
const saving = ref(false);

const completedFiles = computed(() =>
  filesStore.getAllFiles().filter((f) => f.status === 'completed')
);

const tableData = computed(() => {
  if (!selectedFileId.value) return null;
  return dataStore.getTableData(selectedFileId.value);
});

const headers = computed(() => {
  if (!tableData.value) return [];

  const columns = tableData.value.columns.map((col) => ({
    title: col.charAt(0).toUpperCase() + col.slice(1),
    key: col,
    sortable: true,
  }));

  columns.push({
    title: 'Actions',
    key: 'actions',
    sortable: false,
  });

  return columns;
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

async function loadFileData(fileId: string) {
  if (!fileId) return;

  loading.value = true;
  try {
    await dataStore.loadData(fileId);
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    loading.value = false;
  }
}

function updateCell(rowId: string, column: string, value: any) {
  if (!selectedFileId.value) return;
  dataStore.updateRow(selectedFileId.value, rowId, { [column]: value });
}

function isRowModified(rowId: string): boolean {
  if (!selectedFileId.value) return false;
  return dataStore.isRowModified(selectedFileId.value, rowId);
}

function selectFile(fileId: string) {
  if (fileId === selectedFileId.value) return;
  selectedFileId.value = fileId;
  loadFileData(fileId);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function hasFileModifications(fileId: string): boolean {
  const data = dataStore.getTableData(fileId);
  return data ? data.modifiedRows.size > 0 : false;
}

async function saveChanges() {
  if (!selectedFileId.value) return;

  saving.value = true;
  try {
    await dataStore.saveChanges(selectedFileId.value);
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

.files-sidebar {
  width: 280px;
  height: 100%;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  padding: 1rem;
}

.files-sidebar::-webkit-scrollbar {
  width: 6px;
}

.files-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.files-sidebar::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 10px;
}

.files-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

.file-list-item {
  border-left: 3px solid transparent;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.file-list-item:hover {
  background-color: rgba(102, 126, 234, 0.05);
  transform: translateX(4px);
}

.file-list-item.v-list-item--active {
  border-left-color: #667eea;
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
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
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid #e2e8f0;
  padding: 1.5rem;
  border-radius: 20px 20px 0 0;
}

.table-container {
  overflow: auto;
  height: calc(100% - 80px);
  padding: 1.5rem;
}

.table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.table-container::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 10px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.8);
}

.h-100 {
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}

@media (max-width: 968px) {
  .data-editor-layout {
    flex-direction: column;
    height: auto;
  }

  .files-sidebar {
    width: 100%;
    max-height: 300px;
  }

  .main-content {
    min-height: 500px;
  }
}
</style>
