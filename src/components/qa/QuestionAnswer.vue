<template>
  <div class="qa-container glass-card">
    <div class="section-header">
      <div class="title-with-icon">
        <div class="header-icon-wrapper floating-element">
          <v-icon size="32" color="primary">mdi-robot-excited</v-icon>
        </div>
        <div class="header-text">
          <h2 class="section-title gradient-text">AI Assistant</h2>
          <p class="section-subtitle">Ask questions about your data and get instant insights</p>
        </div>
      </div>
    </div>

    <div class="qa-content">
      <v-alert
        type="info"
        variant="tonal"
        class="info-banner"
        border="start"
      >
        <v-icon class="mr-2">mdi-lightbulb-on</v-icon>
        The AI will analyze all your completed files to provide accurate answers
      </v-alert>

      <div class="file-selector">
        <label class="form-label">Query Specific Files (Optional)</label>
        <v-select
          v-model="selectedFileIds"
          :items="completedFiles"
          item-title="name"
          item-value="id"
          placeholder="Leave empty to query all files"
          variant="solo"
          density="comfortable"
          prepend-inner-icon="mdi-file-multiple"
          multiple
          chips
          closable-chips
          class="modern-select"
        ></v-select>
      </div>

      <div class="chat-container modern-scrollbar">
        <div v-if="conversations.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <v-icon size="80" color="grey-lighten-1">mdi-chat-outline</v-icon>
          </div>
          <p class="empty-title">No conversations yet</p>
          <p class="empty-subtitle" v-if="completedFiles.length === 0">
            Upload and process files first to start asking questions
          </p>
          <p class="empty-subtitle" v-else>
            Ask your first question below to get started
          </p>
        </div>

        <div v-else class="messages-list">
          <div
            v-for="(item, index) in conversations"
            :key="index"
            class="conversation-group"
          >
            <div class="message user-message">
              <div class="message-avatar user-avatar">
                <v-icon color="white" size="20">mdi-account</v-icon>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-author">You</span>
                  <span class="message-time">{{ formatTime(item.timestamp) }}</span>
                </div>
                <div class="message-text">{{ item.question }}</div>
              </div>
            </div>

            <div class="message ai-message">
              <div class="message-avatar ai-avatar">
                <v-icon color="white" size="20">mdi-robot</v-icon>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-author">AI Assistant</span>
                </div>
                <div class="message-text">{{ item.answer }}</div>
                <div v-if="item.sources && item.sources.length > 0" class="message-sources">
                  <div class="sources-label">Sources:</div>
                  <div class="sources-chips">
                    <v-tooltip
                      v-for="source in item.sources"
                      :key="source.fileId"
                      location="top"
                    >
                      <template v-slot:activator="{ props }">
                        <v-chip
                          v-bind="props"
                          size="small"
                          color="success"
                          variant="tonal"
                          class="source-chip"
                        >
                          <v-icon size="14" class="mr-1">mdi-file</v-icon>
                          {{ source.fileName }}
                        </v-chip>
                      </template>
                      <span>Relevance: {{ Math.round(source.relevance * 100) }}%</span>
                    </v-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="input-section">
        <div class="input-wrapper">
          <v-text-field
            v-model="question"
            placeholder="Ask a question about your data..."
            variant="solo"
            density="comfortable"
            :disabled="loading || completedFiles.length === 0"
            @keyup.enter="askQuestion"
            hide-details
            class="question-input"
          >
            <template v-slot:prepend-inner>
              <v-icon color="primary">mdi-message-text</v-icon>
            </template>
          </v-text-field>
          <v-btn
            size="large"
            color="primary"
            :disabled="!question || loading || completedFiles.length === 0"
            :loading="loading"
            @click="askQuestion"
            class="send-btn"
          >
            <v-icon>mdi-send</v-icon>
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

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.qa-container {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 280px);
  max-height: calc(100vh - 280px);
  overflow: visible;
}

.section-header {
  text-align: center;
  margin-bottom: 1.5rem;
  flex-shrink: 0;
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

.qa-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: visible;
  min-height: 0;
}

.info-banner {
  border-radius: 12px;
  font-size: 0.875rem;
}

.file-selector {
  flex-shrink: 0;
  position: relative;
  z-index: 10;
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

.modern-select :deep(.v-field__input) {
  min-height: 48px;
}

.modern-select :deep(.v-select__menu-icon) {
  margin-inline-start: 4px;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  background: rgba(248, 250, 252, 0.5);
  border-radius: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
}

.empty-icon-wrapper {
  margin-bottom: 1.5rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 0.5rem 0;
}

.empty-subtitle {
  color: #64748b;
  margin: 0;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.conversation-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  gap: 0.75rem;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ai-avatar {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.message-content {
  flex: 1;
  background: white;
  padding: 1rem;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
}

.user-message .message-content {
  border-color: rgba(102, 126, 234, 0.2);
  background: rgba(102, 126, 234, 0.02);
}

.ai-message .message-content {
  border-color: rgba(16, 185, 129, 0.2);
  background: rgba(16, 185, 129, 0.02);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.message-author {
  font-weight: 600;
  color: #334155;
  font-size: 0.875rem;
}

.message-time {
  color: #94a3b8;
  font-size: 0.75rem;
}

.message-text {
  color: #334155;
  line-height: 1.6;
  font-size: 0.9375rem;
}

.message-sources {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.sources-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sources-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.source-chip {
  font-size: 0.8125rem;
}

.input-section {
  flex-shrink: 0;
  padding-top: 0.75rem;
}

.input-wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.question-input {
  flex: 1;
  border-radius: 12px;
}

.send-btn {
  border-radius: 12px;
  width: 56px;
  height: 56px;
}

@media (max-width: 768px) {
  .qa-container {
    padding: 1.5rem;
    height: calc(100vh - 250px);
    max-height: calc(100vh - 250px);
  }

  .section-title {
    font-size: 1.5rem;
  }

  .message-content {
    padding: 0.75rem;
  }
}
</style>
