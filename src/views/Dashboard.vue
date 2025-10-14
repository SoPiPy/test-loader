<template>
  <v-app>
    <div class="modern-header">
      <div class="header-gradient"></div>
      <div class="header-content">
        <div class="header-left">
          <div class="logo-container floating-element">
            <v-icon size="40" color="white">mdi-database-cog</v-icon>
          </div>
          <div class="title-container">
            <h1 class="header-title">Data Processing Platform</h1>
            <p class="header-subtitle">AI-powered data analysis and insights</p>
          </div>
        </div>

        <div class="header-right">
          <div class="user-chip glass-card">
            <v-icon size="20" class="mr-2" color="primary">mdi-account-circle</v-icon>
            <span class="user-email">{{ authStore.user?.email }}</span>
          </div>
          <v-btn
            icon
            variant="text"
            class="theme-btn"
            @click="toggleTheme"
          >
            <v-icon color="white">{{ isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            class="logout-btn"
            @click="handleLogout"
          >
            <v-icon color="white">mdi-logout</v-icon>
          </v-btn>
        </div>
      </div>

      <div class="tabs-container">
        <div class="floating-tabs glass-card">
          <div
            v-for="tabItem in tabs"
            :key="tabItem.value"
            class="tab-item"
            :class="{ active: tab === tabItem.value }"
            @click="tab = tabItem.value"
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
          </div>
          <div class="tab-indicator" :style="tabIndicatorStyle"></div>
        </div>
      </div>
    </div>

    <v-main class="modern-main">
      <div class="content-wrapper">
        <transition name="fade" mode="out-in">
          <component :is="currentComponent" :key="tab" />
        </transition>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import { useFilesStore } from '@/stores/files';
import { useJobsStore } from '@/stores/jobs';
import FileUpload from '@/components/upload/FileUpload.vue';
import JobStatus from '@/components/status/JobStatus.vue';
import DataTable from '@/components/data/DataTable.vue';
import PresentationGenerator from '@/components/presentation/PresentationGenerator.vue';
import QuestionAnswer from '@/components/qa/QuestionAnswer.vue';

const router = useRouter();
const theme = useTheme();
const authStore = useAuthStore();
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

const currentComponent = computed(() => {
  const components: Record<string, any> = {
    upload: FileUpload,
    status: JobStatus,
    data: DataTable,
    presentation: PresentationGenerator,
    qa: QuestionAnswer,
  };
  return components[tab.value];
});

const tabIndicatorStyle = computed(() => {
  const index = tabs.findIndex((t) => t.value === tab.value);
  const width = 100 / tabs.length;
  return {
    transform: `translateX(${index * 100}%)`,
    width: `${width}%`,
  };
});

onMounted(() => {
  filesStore.initializeMockData();
  jobsStore.initializeMockJobs();
});

const activeJobsCount = computed(() => {
  return filesStore.getAllFiles().filter(
    (f) => f.status === 'processing' || f.status === 'uploaded'
  ).length;
});

function handleLogout() {
  jobsStore.stopAllPolling();
  authStore.logout();
  router.push('/login');
}

onUnmounted(() => {
  jobsStore.stopAllPolling();
});
</script>

<style scoped>
.modern-header {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  overflow: hidden;
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
}

.header-content {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 3rem 1.5rem;
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.logo-container {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-chip {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 50px;
}

.v-theme--light .user-chip {
  background: rgba(255, 255, 255, 0.95);
}

.v-theme--dark .user-chip {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.user-email {
  font-size: 0.875rem;
  font-weight: 500;
}

.v-theme--light .user-email {
  color: #667eea;
}

.v-theme--dark .user-email {
  color: #93c5fd;
}

.theme-btn,
.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.theme-btn:hover,
.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.tabs-container {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 0 3rem 2rem;
  z-index: 1;
}

.floating-tabs {
  display: flex;
  position: relative;
  padding: 0.5rem;
  border-radius: 16px;
  gap: 0.5rem;
}

.v-theme--light .floating-tabs {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.2);
}

.v-theme--dark .floating-tabs {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.tab-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
  font-weight: 500;
  font-size: 0.9rem;
  user-select: none;
}

.v-theme--light .tab-item {
  color: #64748b;
}

.v-theme--dark .tab-item {
  color: #94a3b8;
}

.v-theme--light .tab-item:hover {
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
}

.v-theme--dark .tab-item:hover {
  background: rgba(147, 197, 253, 0.08);
  color: #93c5fd;
}

.tab-item.active {
  color: white;
}

.tab-item.active .tab-icon {
  color: white !important;
}

.tab-icon {
  transition: all 0.3s ease;
}

.tab-label {
  font-weight: 600;
}

.tab-badge {
  margin-left: 0.25rem;
}

.tab-indicator {
  position: absolute;
  top: 0.5rem;
  bottom: 0.5rem;
  left: 0.5rem;
  border-radius: 12px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.v-theme--light .tab-indicator {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.v-theme--dark .tab-indicator {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.modern-main {
  background: transparent;
  padding: 2rem 3rem;
  height: calc(100vh - 240px);
  overflow: hidden;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  overflow: hidden;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }

  .header-title {
    font-size: 1.25rem;
  }

  .header-subtitle {
    font-size: 0.75rem;
  }

  .floating-tabs {
    flex-wrap: wrap;
    justify-content: center;
  }

  .tab-label {
    display: none;
  }

  .modern-main {
    padding: 1rem;
  }
}
</style>
