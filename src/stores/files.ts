import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { FileUpload } from '@/types';
import api from '@/services/api';
import { initializeMockFiles } from '@/services/mock-data';

export const useFilesStore = defineStore('files', () => {
  const files = ref<Map<string, FileUpload>>(new Map());
  const selectedFileId = ref<string>('');

  function initializeMockData() {
    const mockFiles = initializeMockFiles();
    mockFiles.forEach(file => {
      files.value.set(file.id, file);
    });
  }

  function setSelectedFile(fileId: string) {
    selectedFileId.value = fileId;
  }

  function addFile(file: File): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fileUpload: FileUpload = {
      id,
      name: file.name,
      size: file.size,
      s3Key: '',
      uploadProgress: 0,
      status: 'uploading',
      uploadedAt: new Date(),
    };
    files.value.set(id, fileUpload);
    return id;
  }

  async function uploadFile(fileId: string, file: File) {
    const fileUpload = files.value.get(fileId);
    if (!fileUpload) return;

    try {
      const progressInterval = setInterval(() => {
        if (fileUpload.uploadProgress < 100) {
          fileUpload.uploadProgress += 20;
          files.value.set(fileId, { ...fileUpload });
        } else {
          clearInterval(progressInterval);
        }
      }, 200);

      await new Promise(resolve => setTimeout(resolve, 1000));
      clearInterval(progressInterval);

      fileUpload.uploadProgress = 100;
      fileUpload.s3Key = `mock/${file.name}`;
      fileUpload.status = 'uploaded';
      files.value.set(fileId, { ...fileUpload });

      const { jobId } = await api.triggerExtraction(fileId, fileUpload.s3Key);
      fileUpload.jobId = jobId;
      fileUpload.status = 'processing';
      files.value.set(fileId, { ...fileUpload });
    } catch (error: any) {
      fileUpload.status = 'error';
      fileUpload.error = error.message;
      files.value.set(fileId, { ...fileUpload });
    }
  }

  function updateFileStatus(fileId: string, status: FileUpload['status']) {
    const file = files.value.get(fileId);
    if (file) {
      file.status = status;
      files.value.set(fileId, { ...file });
    }
  }

  function removeFile(fileId: string) {
    files.value.delete(fileId);
  }

  function getFile(fileId: string): FileUpload | undefined {
    return files.value.get(fileId);
  }

  function getAllFiles(): FileUpload[] {
    return Array.from(files.value.values());
  }

  return {
    files,
    selectedFileId,
    addFile,
    uploadFile,
    updateFileStatus,
    removeFile,
    getFile,
    getAllFiles,
    initializeMockData,
    setSelectedFile,
  };
});
