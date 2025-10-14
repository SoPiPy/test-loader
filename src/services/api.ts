import type { Job, DataRow, PresentationRequest, QARequest, QAResponse } from '@/types';
import { createMockJob, updateMockJobProgress, mockJobs, mockData, getMockQAResponse } from './mock-data';

const USE_MOCK = true;

class ApiService {
  async triggerExtraction(fileId: string, s3Key: string): Promise<{ jobId: string }> {
    if (USE_MOCK) {
      await this.delay(500);
      const job = createMockJob(fileId);
      return { jobId: job.id };
    }
    throw new Error('Backend not configured');
  }

  async getJobStatus(jobId: string): Promise<Job> {
    if (USE_MOCK) {
      await this.delay(300);
      updateMockJobProgress(jobId);
      const job = mockJobs.get(jobId);
      if (!job) throw new Error('Job not found');
      return job;
    }
    throw new Error('Backend not configured');
  }

  async getData(fileId: string): Promise<{ columns: string[]; rows: DataRow[] }> {
    if (USE_MOCK) {
      await this.delay(500);
      const data = mockData.get(fileId);
      if (!data) throw new Error('Data not found');
      return data;
    }
    throw new Error('Backend not configured');
  }

  async updateData(fileId: string, modifiedRows: DataRow[]): Promise<void> {
    if (USE_MOCK) {
      await this.delay(800);
      const data = mockData.get(fileId);
      if (!data) throw new Error('Data not found');

      modifiedRows.forEach(modifiedRow => {
        const index = data.rows.findIndex(r => r.id === modifiedRow.id);
        if (index !== -1) {
          data.rows[index] = modifiedRow;
        }
      });

      mockData.set(fileId, data);
      return;
    }
    throw new Error('Backend not configured');
  }

  async generatePresentation(request: PresentationRequest): Promise<{ downloadUrl: string }> {
    if (USE_MOCK) {
      await this.delay(1500);
      return {
        downloadUrl: `#mock-presentation-${request.fileId}-${request.format}`,
      };
    }
    throw new Error('Backend not configured');
  }

  async askQuestion(request: QARequest): Promise<QAResponse> {
    if (USE_MOCK) {
      await this.delay(1200);
      return getMockQAResponse(request.question);
    }
    throw new Error('Backend not configured');
  }

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    if (USE_MOCK) {
      await this.delay(800);

      if (email && password) {
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwibmFtZSI6IkRlbW8gVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjo5OTk5OTk5OTk5fQ.4Adcj0bT-Klm3KWZy2Aa2GJmU3A2Zw-FWWx6C0nHx5Q';
        return {
          token: mockToken,
          user: {
            id: '1',
            email: email,
            name: 'Demo User',
          },
        };
      }

      throw new Error('Invalid credentials');
    }
    throw new Error('Backend not configured');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ApiService();
