import type { Job, DataRow, QAResponse, FileUpload } from '@/types';

export const mockJobs: Map<string, Job> = new Map();
export const mockData: Map<string, { columns: string[]; rows: DataRow[] }> = new Map();

function initializeMockJobs() {
  const jobs: Job[] = [
    {
      id: 'job-1',
      fileId: 'file-1',
      status: 'completed',
      progress: 100,
      message: 'Extraction completed successfully',
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 3000000),
    },
    {
      id: 'job-2',
      fileId: 'file-2',
      status: 'completed',
      progress: 100,
      message: 'Extraction completed successfully',
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(Date.now() - 6600000),
    },
    {
      id: 'job-3',
      fileId: 'file-3',
      status: 'completed',
      progress: 100,
      message: 'Extraction completed successfully',
      createdAt: new Date(Date.now() - 10800000),
      updatedAt: new Date(Date.now() - 10200000),
    },
  ];

  jobs.forEach(job => {
    mockJobs.set(job.id, job);
    generateMockDataForJob(job.id);
  });
}

export function initializeMockFiles(): FileUpload[] {
  initializeMockJobs();
  const files: FileUpload[] = [
    {
      id: 'file-1',
      name: 'sales-data-q1.csv',
      size: 245600,
      s3Key: 'mock/sales-data-q1.csv',
      uploadProgress: 100,
      status: 'completed',
      uploadedAt: new Date(Date.now() - 3600000),
      jobId: 'job-1',
    },
    {
      id: 'file-2',
      name: 'customer-records.xlsx',
      size: 512000,
      s3Key: 'mock/customer-records.xlsx',
      uploadProgress: 100,
      status: 'completed',
      uploadedAt: new Date(Date.now() - 7200000),
      jobId: 'job-2',
    },
    {
      id: 'file-3',
      name: 'inventory-2024.csv',
      size: 189440,
      s3Key: 'mock/inventory-2024.csv',
      uploadProgress: 100,
      status: 'completed',
      uploadedAt: new Date(Date.now() - 10800000),
      jobId: 'job-3',
    },
    {
      id: 'file-4',
      name: 'product-analysis.xlsx',
      size: 421888,
      s3Key: 'mock/product-analysis.xlsx',
      uploadProgress: 65,
      status: 'processing',
      uploadedAt: new Date(Date.now() - 300000),
      jobId: 'job-4',
    },
    {
      id: 'file-5',
      name: 'financial-report.csv',
      size: 678912,
      s3Key: 'mock/financial-report.csv',
      uploadProgress: 100,
      status: 'completed',
      uploadedAt: new Date(Date.now() - 14400000),
      jobId: 'job-5',
    },
  ];


  return files;
}

export function createMockJob(fileId: string): Job {
  const job: Job = {
    id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    fileId,
    status: 'processing',
    progress: 0,
    message: 'Starting extraction...',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockJobs.set(job.id, job);
  return job;
}

export function updateMockJobProgress(jobId: string): void {
  const job = mockJobs.get(jobId);
  if (!job) return;

  job.progress = Math.min(100, job.progress + 20);
  job.updatedAt = new Date();

  if (job.progress >= 100) {
    job.status = 'completed';
    job.message = 'Extraction completed successfully';
    generateMockDataForJob(jobId);
  } else {
    job.message = `Processing... ${job.progress}%`;
  }

  mockJobs.set(jobId, job);
}

function generateMockDataForJob(jobId: string): void {
  const columns = [
    'id',
    'company_name',
    'revenue',
    'expenses',
    'profit',
    'employees',
    'industry',
    'location',
    'year_founded',
    'ceo_name',
  ];

  const row: DataRow = {
    id: `file-${jobId}`,
    company_name: generateCompanyName(),
    revenue: `$${Math.floor(Math.random() * 5000000 + 1000000).toLocaleString()}`,
    expenses: `$${Math.floor(Math.random() * 3000000 + 500000).toLocaleString()}`,
    profit: `$${Math.floor(Math.random() * 2000000 + 100000).toLocaleString()}`,
    employees: Math.floor(Math.random() * 500 + 50),
    industry: getRandomIndustry(),
    location: getRandomLocation(),
    year_founded: Math.floor(Math.random() * 50 + 1974),
    ceo_name: getRandomCEOName(),
  };

  mockData.set(jobId, { columns, rows: [row] });
}

function generateCompanyName(): string {
  const prefixes = ['Tech', 'Global', 'Digital', 'Smart', 'Advanced', 'Future', 'Innovate'];
  const suffixes = ['Solutions', 'Systems', 'Corp', 'Industries', 'Group', 'Enterprises'];
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
}

function getRandomIndustry(): string {
  const industries = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Consulting'];
  return industries[Math.floor(Math.random() * industries.length)];
}

function getRandomLocation(): string {
  const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Chicago, IL'];
  return locations[Math.floor(Math.random() * locations.length)];
}

function getRandomCEOName(): string {
  const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jennifer', 'Robert', 'Lisa'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

export function getMockQAResponse(question: string): QAResponse {
  return {
    answer: `This is a mock answer to your question: "${question}". In a real implementation, this would be generated by analyzing the data from your uploaded files using AI.`,
    sources: [
      {
        fileId: 'mock-file-1',
        fileName: 'sample-data.csv',
        relevance: 0.85,
      },
      {
        fileId: 'mock-file-2',
        fileName: 'additional-data.xlsx',
        relevance: 0.72,
      },
    ],
    timestamp: new Date(),
  };
}
