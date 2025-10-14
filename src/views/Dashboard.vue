<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title class="text-white">
        <v-icon class="mr-2">mdi-database</v-icon>
        Data Processing Platform
      </v-app-bar-title>

      <template v-slot:append>
        <v-chip class="mr-4">
          <v-icon left>mdi-account</v-icon>
          {{ authStore.user?.email }}
        </v-chip>
        <v-btn icon @click="handleLogout">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </template>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <v-container fluid>
        <v-tabs v-model="tab" align-tabs="center" color="primary" class="mb-4">
          <v-tab value="upload">
            <v-icon left>mdi-upload</v-icon>
            Upload
          </v-tab>
          <v-tab value="status">
            <v-icon left>mdi-progress-check</v-icon>
            Status
            <v-badge
              v-if="activeJobsCount > 0"
              :content="activeJobsCount"
              color="orange"
              class="ml-2"
            ></v-badge>
          </v-tab>
          <v-tab value="data">
            <v-icon left>mdi-table-edit</v-icon>
            Data
          </v-tab>
          <v-tab value="presentation">
            <v-icon left>mdi-presentation</v-icon>
            Presentation
          </v-tab>
          <v-tab value="qa">
            <v-icon left>mdi-chat-question</v-icon>
            Q&A
          </v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item value="upload">
            <file-upload />
          </v-window-item>

          <v-window-item value="status">
            <job-status />
          </v-window-item>

          <v-window-item value="data">
            <data-table />
          </v-window-item>

          <v-window-item value="presentation">
            <presentation-generator />
          </v-window-item>

          <v-window-item value="qa">
            <question-answer />
          </v-window-item>
        </v-window>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useFilesStore } from '@/stores/files';
import { useJobsStore } from '@/stores/jobs';
import FileUpload from '@/components/upload/FileUpload.vue';
import JobStatus from '@/components/status/JobStatus.vue';
import DataTable from '@/components/data/DataTable.vue';
import PresentationGenerator from '@/components/presentation/PresentationGenerator.vue';
import QuestionAnswer from '@/components/qa/QuestionAnswer.vue';

const router = useRouter();
const authStore = useAuthStore();
const filesStore = useFilesStore();
const jobsStore = useJobsStore();

const tab = ref('upload');

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
