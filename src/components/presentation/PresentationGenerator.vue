<template>
  <div class="presentation-layout">
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
        </v-list-item>
      </v-list>
    </div>

    <div class="main-content">
      <v-card class="h-100">
        <v-card-title class="sticky-header">
          <div class="title-with-icon">
            <div class="header-icon-wrapper">
              <v-icon size="28" color="primary">mdi-presentation</v-icon>
            </div>
            <div class="header-text">
              <h3 class="card-title">Generate Presentation</h3>
              <p class="card-subtitle">Create stunning presentations from your data</p>
            </div>
          </div>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="content-scroll">
          <div v-if="!selectedJobId" class="text-center py-12 text-grey">
            <v-icon size="80" color="grey-lighten-1">mdi-presentation</v-icon>
            <p class="mt-4 text-h6">Select a job from the sidebar</p>
            <p class="text-body-2">Choose a job to generate presentation from</p>
          </div>

          <div v-else class="form-content">
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

            <v-btn
              size="large"
              color="primary"
              :disabled="generating"
              :loading="generating"
              @click="generatePresentation"
              block
              class="generate-btn"
            >
              <v-icon class="mr-2">mdi-sparkles</v-icon>
              Generate Presentation
            </v-btn>

            <div v-if="generatedPresentations.length > 0" class="generated-section mt-6">
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
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useJobsStore } from '@/stores/jobs';
import { useSelectedJobStore } from '@/stores/selectedJob';
import api from '@/services/api';

const jobsStore = useJobsStore();
const selectedJobStore = useSelectedJobStore();

const { selectedJobId } = storeToRefs(selectedJobStore);

const format = ref<'pdf' | 'pptx'>('pdf');
const template = ref<string>('');
const generating = ref(false);

const generatedPresentations = ref<Array<{
  fileName: string;
  format: string;
  downloadUrl: string;
  createdAt: Date;
}>>([]);

const completedJobs = computed(() => {
  return Array.from(jobsStore.jobs.values()).filter(j => j.status === 'completed');
});

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

function selectJob(jobId: string) {
  selectedJobStore.setSelectedJob(jobId);
}

async function generatePresentation() {
  if (!selectedJobId.value) return;

  generating.value = true;
  try {
    const { downloadUrl } = await api.generatePresentation({
      jobId: selectedJobId.value,
      format: format.value,
      template: template.value || undefined,
    });

    generatedPresentations.value.unshift({
      fileName: `Job #${selectedJobId.value.slice(-6)} - Presentation`,
      format: format.value,
      downloadUrl,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to generate presentation:', error);
  } finally {
    generating.value = false;
  }
}
</script>

<style scoped>
.presentation-layout {
  display: flex;
  gap: 2rem;
  height: calc(100vh - 280px);
  max-height: calc(100vh - 280px);
  overflow: hidden;
}

.jobs-sidebar {
  width: 220px;
  height: 100%;
  overflow-y: auto;
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 1rem;
  flex-shrink: 0;
}

.v-theme--light .jobs-sidebar {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}

.v-theme--dark .jobs-sidebar {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

.jobs-sidebar::-webkit-scrollbar {
  width: 6px;
}

.jobs-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.jobs-sidebar::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 10px;
}

.jobs-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

.job-list-item {
  border-left: 3px solid transparent;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.job-list-item:hover {
  background-color: rgba(102, 126, 234, 0.05);
}

.job-list-item.v-list-item--active {
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

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 1.5rem 1.5rem 1rem 1.5rem !important;
}

.v-theme--light .sticky-header {
  background: rgba(255, 255, 255, 0.98);
}

.v-theme--dark .sticky-header {
  background: rgba(15, 23, 42, 0.98);
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.header-icon-wrapper {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.content-scroll {
  overflow: auto;
  height: calc(100% - 80px);
  padding: 1.5rem;
}

.content-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.content-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.content-scroll::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 10px;
}

.content-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.8);
}

.form-content {
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

.generate-btn {
  margin-top: 2rem;
  padding: 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
}

.generated-section {
  padding: 2rem;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.02);
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

@media (max-width: 968px) {
  .presentation-layout {
    flex-direction: column;
    height: auto;
  }

  .jobs-sidebar {
    width: 100%;
    max-height: 300px;
  }

  .main-content {
    min-height: 500px;
  }
}
</style>
