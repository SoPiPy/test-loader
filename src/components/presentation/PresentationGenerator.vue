<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-presentation</v-icon>
      Presentation Generator
    </v-card-title>

    <v-card-text>
      <v-select
        v-model="selectedFileId"
        :items="completedFiles"
        item-title="name"
        item-value="id"
        label="Select file"
        prepend-icon="mdi-file"
      ></v-select>

      <v-select
        v-model="format"
        :items="formats"
        label="Format"
        prepend-icon="mdi-file-document"
        class="mt-4"
      ></v-select>

      <v-select
        v-model="template"
        :items="templates"
        label="Template (optional)"
        prepend-icon="mdi-palette"
        clearable
        class="mt-4"
      ></v-select>

      <v-btn
        color="primary"
        :disabled="!selectedFileId || generating"
        :loading="generating"
        @click="generatePresentation"
        block
        class="mt-4"
      >
        <v-icon left>mdi-file-download</v-icon>
        Generate Presentation
      </v-btn>

      <v-divider class="my-4"></v-divider>

      <div v-if="generatedPresentations.length > 0">
        <h3 class="mb-3">Generated Presentations</h3>
        <v-list>
          <v-list-item
            v-for="(presentation, index) in generatedPresentations"
            :key="index"
          >
            <template v-slot:prepend>
              <v-icon color="green">mdi-check-circle</v-icon>
            </template>

            <v-list-item-title>
              {{ presentation.fileName }} ({{ presentation.format.toUpperCase() }})
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ new Date(presentation.createdAt).toLocaleString() }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn
                icon="mdi-download"
                size="small"
                variant="text"
                :href="presentation.downloadUrl"
                download
              ></v-btn>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
  </v-card>
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
