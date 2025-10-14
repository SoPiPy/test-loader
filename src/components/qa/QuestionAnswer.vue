<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-chat-question</v-icon>
      AI Question & Answer
    </v-card-title>

    <v-card-text>
      <v-alert type="info" variant="tonal" class="mb-4">
        Ask questions about your uploaded data. The AI will analyze all completed files to provide answers.
      </v-alert>

      <div class="d-flex gap-2 mb-4">
        <v-text-field
          v-model="question"
          label="Ask a question"
          placeholder="e.g., What are the key trends in this data?"
          prepend-icon="mdi-message-question"
          :disabled="loading || completedFiles.length === 0"
          @keyup.enter="askQuestion"
          clearable
        ></v-text-field>

        <v-btn
          color="primary"
          :disabled="!question || loading || completedFiles.length === 0"
          :loading="loading"
          @click="askQuestion"
        >
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </div>

      <v-select
        v-model="selectedFileIds"
        :items="completedFiles"
        item-title="name"
        item-value="id"
        label="Select files to query (optional - defaults to all)"
        prepend-icon="mdi-file-multiple"
        multiple
        chips
        closable-chips
        class="mb-4"
      ></v-select>

      <v-divider class="my-4"></v-divider>

      <div v-if="conversations.length === 0" class="text-center py-8 text-grey">
        <v-icon size="64" color="grey-lighten-1">mdi-forum-outline</v-icon>
        <p class="mt-4">No questions asked yet</p>
        <p v-if="completedFiles.length === 0" class="text-caption">
          Upload and process files first
        </p>
      </div>

      <v-timeline v-else side="end" align="start">
        <v-timeline-item
          v-for="(item, index) in conversations"
          :key="index"
          dot-color="primary"
          size="small"
        >
          <div class="mb-4">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2" color="primary">mdi-account</v-icon>
              <span class="font-weight-bold">You</span>
              <v-chip size="x-small" class="ml-2">
                {{ new Date(item.timestamp).toLocaleTimeString() }}
              </v-chip>
            </div>
            <v-card variant="tonal" color="primary">
              <v-card-text>{{ item.question }}</v-card-text>
            </v-card>
          </div>

          <div class="mt-2">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2" color="green">mdi-robot</v-icon>
              <span class="font-weight-bold">AI Assistant</span>
            </div>
            <v-card variant="tonal" color="green">
              <v-card-text>
                {{ item.answer }}
              </v-card-text>

              <v-card-text v-if="item.sources && item.sources.length > 0">
                <div class="text-caption text-grey mb-2">Sources:</div>
                <v-chip
                  v-for="source in item.sources"
                  :key="source.fileId"
                  size="small"
                  class="mr-1 mb-1"
                >
                  <v-icon size="small" class="mr-1">mdi-file</v-icon>
                  {{ source.fileName }}
                  <v-tooltip activator="parent" location="top">
                    Relevance: {{ Math.round(source.relevance * 100) }}%
                  </v-tooltip>
                </v-chip>
              </v-card-text>
            </v-card>
          </div>
        </v-timeline-item>
      </v-timeline>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFilesStore } from '@/stores/files';
import api from '@/services/api';
import type { QAResponse } from '@/types';

const filesStore = useFilesStore();

const question = ref('');
const selectedFileIds = ref<string[]>([]);
const loading = ref(false);

const conversations = ref<Array<{
  question: string;
  answer: string;
  sources: QAResponse['sources'];
  timestamp: Date;
}>>([]);

const completedFiles = computed(() =>
  filesStore.getAllFiles().filter((f) => f.status === 'completed')
);

async function askQuestion() {
  if (!question.value) return;

  loading.value = true;
  const currentQuestion = question.value;

  try {
    const response = await api.askQuestion({
      question: currentQuestion,
      fileIds: selectedFileIds.value.length > 0 ? selectedFileIds.value : undefined,
    });

    conversations.value.push({
      question: currentQuestion,
      answer: response.answer,
      sources: response.sources,
      timestamp: new Date(),
    });

    question.value = '';
  } catch (error) {
    console.error('Failed to get answer:', error);
  } finally {
    loading.value = false;
  }
}
</script>
