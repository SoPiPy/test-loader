<template>
  <div class="presentation-container glass-card">
    <div class="section-header">
      <div class="header-icon-wrapper floating-element">
        <v-icon size="32" color="primary">mdi-presentation</v-icon>
      </div>
      <h2 class="section-title gradient-text">Generate Presentation</h2>
      <p class="section-subtitle">Transform your data into beautiful presentations</p>
    </div>

    <div class="presentation-content">
      <div class="form-section">
        <label class="form-label">Select File</label>
        <v-select
          v-model="selectedFileId"
          :items="completedFiles"
          item-title="name"
          item-value="id"
          placeholder="Choose a file to generate presentation from"
          variant="solo"
          density="comfortable"
          prepend-inner-icon="mdi-file"
          class="modern-select"
        ></v-select>
      </div>

      <div class="options-grid">
        <div class="form-section">
          <label class="form-label">Output Format</label>
          <v-select
            v-model="format"
            :items="formats"
            variant="solo"
            density="comfortable"
            prepend-inner-icon="mdi-file-document"
            class="modern-select"
          ></v-select>
        </div>

        <div class="form-section">
          <label class="form-label">Template (Optional)</label>
          <v-select
            v-model="template"
            :items="templates"
            placeholder="Choose a template"
            variant="solo"
            density="comfortable"
            prepend-inner-icon="mdi-palette"
            clearable
            class="modern-select"
          ></v-select>
        </div>
      </div>

      <v-btn
        size="large"
        color="primary"
        :disabled="!selectedFileId || generating"
        :loading="generating"
        @click="generatePresentation"
        block
        class="generate-btn"
      >
        <v-icon class="mr-2">mdi-sparkles</v-icon>
        Generate Presentation
      </v-btn>
    </div>

    <div v-if="generatedPresentations.length > 0" class="generated-section glass-card mt-6">
      <div class="list-header">
        <h3 class="list-title">Generated Presentations</h3>
        <v-chip size="small" color="success" variant="tonal">
          {{ generatedPresentations.length }} total
        </v-chip>
      </div>

      <div class="presentations-list">
        <div
          v-for="(presentation, index) in generatedPresentations"
          :key="index"
          class="presentation-card"
        >
          <div class="presentation-icon">
            <v-icon size="32" color="white">mdi-file-presentation-box</v-icon>
          </div>
          <div class="presentation-info">
            <p class="presentation-name">{{ presentation.fileName }}</p>
            <p class="presentation-meta">
              {{ presentation.format.toUpperCase() }} • {{ new Date(presentation.createdAt).toLocaleString() }}
            </p>
          </div>
          <v-btn
            icon
            variant="tonal"
            color="primary"
            :href="presentation.downloadUrl"
            download
          >
            <v-icon>mdi-download</v-icon>
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFilesStore } from '@/stores/files';
import api from '@/services/api';

const filesStore = useFilesStore();

const selectedFileId = ref<string>('');
const format = ref<'pdf' | 'pptx'>('pdf');
const template = ref<string>('');
const generating = ref(false);

const generatedPresentations = ref<Array<{
  fileName: string;
  format: string;
  downloadUrl: string;
  createdAt: Date;
}>>([]);

const completedFiles = computed(() =>
  filesStore.getAllFiles().filter((f) => f.status === 'completed')
);

const formats = [
  { title: 'PDF', value: 'pdf' },
  { title: 'PowerPoint (PPTX)', value: 'pptx' },
];

const templates = [
  { title: 'Modern', value: 'modern' },
  { title: 'Professional', value: 'professional' },
  { title: 'Minimal', value: 'minimal' },
  { title: 'Creative', value: 'creative' },
];

async function generatePresentation() {
  if (!selectedFileId.value) return;

  generating.value = true;
  try {
    const { downloadUrl } = await api.generatePresentation({
      fileId: selectedFileId.value,
      format: format.value,
      template: template.value || undefined,
    });

    const file = filesStore.getFile(selectedFileId.value);
    if (file) {
      generatedPresentations.value.unshift({
        fileName: file.name,
        format: format.value,
        downloadUrl,
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Failed to generate presentation:', error);
  } finally {
    generating.value = false;
  }
}
</script>

<style scoped>
.presentation-container {
  padding: 2.5rem;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.header-icon-wrapper {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

.presentation-content {
  max-width: 700px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.modern-select {
  border-radius: 12px;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.generate-btn {
  margin-top: 2rem;
  padding: 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
}

.generated-section {
  padding: 2rem;
  margin-top: 2rem;
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
  color: #334155;
  margin: 0;
}

.presentations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.presentation-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.presentation-card:hover {
  border-color: #cbd5e1;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.presentation-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.presentation-info {
  flex: 1;
  min-width: 0;
}

.presentation-name {
  font-weight: 600;
  color: #334155;
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.presentation-meta {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

@media (max-width: 768px) {
  .presentation-container,
  .generated-section {
    padding: 1.5rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .options-grid {
    grid-template-columns: 1fr;
  }
}
</style>
