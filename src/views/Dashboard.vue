<template>
  <v-app>
    <v-main class="modern-main">
      <div class="modern-header">
        <div class="header-gradient"></div>

        <v-container fluid class="header-container">
          <v-row align="center" justify="space-between" no-gutters>
            <v-col cols="auto">
              <div class="header-left">
                <v-avatar
                  size="64"
                  rounded="lg"
                  class="logo-container"
                >
                  <v-icon size="40" color="white">mdi-database-cog</v-icon>
                </v-avatar>

                <div class="title-container">
                  <h1 class="header-title">Data Processing Platform</h1>
                  <p class="header-subtitle">AI-powered data analysis and insights</p>
                </div>
              </div>
            </v-col>

            <v-col cols="auto">
              <v-btn
                icon
                variant="text"
                class="theme-btn"
                @click="toggleTheme"
              >
                <v-icon color="white">{{ isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
              </v-btn>
            </v-col>
          </v-row>

          <v-row justify="center" class="tabs-row">
            <v-col cols="auto">
              <v-card class="floating-tabs" rounded="lg" elevation="0">
                <v-tabs
                  v-model="tab"
                  color="primary"
                  bg-color="transparent"
                  slider-color="transparent"
                  height="56"
                  show-arrows
                  density="comfortable"
                >
                  <v-tab
                    v-for="tabItem in tabs"
                    :key="tabItem.value"
                    :value="tabItem.value"
                    class="tab-item"
                    rounded="lg"
                  >
                    <v-icon :size="20" class="tab-icon">{{ tabItem.icon }}</v-icon>
                    <span class="tab-label">{{ tabItem.label }}</span>
                    <v-badge
                      v-if="tabItem.value === 'status' && activeJobsCount > 0"
                      :content="activeJobsCount"
                      color="error"
                      inline
                      class="tab-badge"
                    ></v-badge>
                  </v-tab>
                </v-tabs>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <v-container fluid class="content-container">
        <v-window v-model="tab" class="fill-height">
          <v-window-item
            v-for="tabItem in tabs"
            :key="tabItem.value"
            :value="tabItem.value"
            class="fill-height"
          >
            <component :is="getComponent(tabItem.value)" />
          </v-window-item>
        </v-window>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useTheme } from 'vuetify';
import { useFilesStore } from '@/stores/files';
import { useJobsStore } from '@/stores/jobs';
import FileUpload from '@/components/upload/FileUpload.vue';
import JobStatus from '@/components/status/JobStatus.vue';
import DataTable from '@/components/data/DataTable.vue';
import PresentationGenerator from '@/components/presentation/PresentationGenerator.vue';
import QuestionAnswer from '@/components/qa/QuestionAnswer.vue';

const theme = useTheme();
const filesStore = useFilesStore();
const jobsStore = useJobsStore();

const tab = ref('upload');
const isDark = computed(() => theme.global.current.value.dark);

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark';
}

const tabs = [
  { value: 'upload', label: 'Upload', icon: 'mdi-upload' },
  { value: 'status', label: 'Status', icon: 'mdi-progress-check' },
  { value: 'data', label: 'Data', icon: 'mdi-table-edit' },
  { value: 'presentation', label: 'Presentation', icon: 'mdi-presentation' },
  { value: 'qa', label: 'Q&A', icon: 'mdi-chat-question' },
];

function getComponent(value: string) {
  const components: Record<string, any> = {
    upload: FileUpload,
    status: JobStatus,
    data: DataTable,
    presentation: PresentationGenerator,
    qa: QuestionAnswer,
  };
  return components[value];
}

onMounted(() => {
  filesStore.initializeMockData();
  jobsStore.initializeMockJobs();
});

const activeJobsCount = computed(() => {
  return filesStore.getAllFiles().filter(
    (f) => f.status === 'processing' || f.status === 'uploaded'
  ).length;
});

onUnmounted(() => {
  jobsStore.stopAllPolling();
});
</script>

<style scoped>
.modern-header {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  padding: 1.25rem 0 !important;
  flex-shrink: 0;
}

.header-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.header-container {
  position: relative;
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.logo-container {
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.title-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: -0.5px;
}

.header-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-weight: 400;
}

.theme-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.theme-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  transform: scale(1.05);
}

.tabs-row {
  margin-top: 1rem;
}

.floating-tabs {
  position: relative;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.2) !important;
  padding: 0.5rem;
}

.v-theme--dark .floating-tabs {
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

:deep(.v-tabs) {
  position: relative;
}

.tab-item {
  position: relative;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
  min-width: auto;
  padding: 0.75rem 1.5rem;
  margin: 0 0.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
  color: #64748b;
  border-radius: 12px;
}

.v-theme--dark .tab-item {
  color: #94a3b8;
}

.tab-item:hover:not(.v-tab--selected) {
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
  border-radius: 12px;
}

.v-theme--dark .tab-item:hover:not(.v-tab--selected) {
  background: rgba(147, 197, 253, 0.08);
  color: #93c5fd;
}

:deep(.v-tab--selected) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  border-radius: 12px !important;
}

.v-theme--dark :deep(.v-tab--selected) {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

:deep(.v-tab--selected .v-icon) {
  color: white !important;
}

.tab-icon {
  margin-right: 0.5rem;
  transition: all 0.3s ease;
}

.tab-label {
  font-weight: 600;
}

.tab-badge {
  margin-left: 0.25rem;
}

.modern-main {
  background: transparent;
  padding-top: 0 !important;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-container {
  max-width: 100%;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.fill-height {
  height: 100%;
  overflow: hidden;
}

:deep(.v-window__container) {
  height: 100%;
}

:deep(.v-window-item) {
  height: 100%;
}

@media (max-width: 768px) {
  .header-title {
    font-size: 1.25rem;
  }

  .header-subtitle {
    font-size: 0.75rem;
  }

  .tab-label {
    display: none;
  }

  .content-container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
