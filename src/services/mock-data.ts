import type { Job, DataRow, QAResponse, FileUpload } from '@/types';

export const mockJobs: Map<string, Job> = new Map();
export const mockData: Map<string, { columns: string[]; rows: DataRow[] }> = new Map();

export function initializeMockFiles(): FileUpload[] {
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

  files.forEach(file => {
    if (file.status === 'completed') {
      generateMockDataForFile(file.id, file.name);
    }
  });

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
    generateMockDataForFile(job.fileId, 'data.csv');
  } else {
    job.message = `Processing... ${job.progress}%`;
  }

  mockJobs.set(jobId, job);
}

function generateMockDataForFile(fileId: string, fileName: string): void {
  let columns: string[];
  let rows: DataRow[] = [];

  if (fileName.includes('sales')) {
    columns = ['id', 'product', 'quantity', 'price', 'revenue', 'date', 'region'];
    const products = ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Headphones', 'Webcam'];
    const regions = ['North', 'South', 'East', 'West'];

    for (let i = 1; i <= 25; i++) {
      const quantity = Math.floor(Math.random() * 50) + 1;
      const price = Math.floor(Math.random() * 500) + 100;
      rows.push({
        id: `row-${i}`,
        product: products[Math.floor(Math.random() * products.length)],
        quantity,
        price,
        revenue: quantity * price,
        date: new Date(Date.now() - Math.random() * 7776000000).toISOString().split('T')[0],
        region: regions[Math.floor(Math.random() * regions.length)],
      });
    }
  } else if (fileName.includes('customer')) {
    columns = ['id', 'name', 'email', 'phone', 'city', 'status', 'joined'];
    const names = ['John Smith', 'Emma Wilson', 'Michael Brown', 'Sarah Davis', 'James Johnson', 'Lisa Anderson'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    const statuses = ['Active', 'Inactive', 'VIP'];

    for (let i = 1; i <= 30; i++) {
      rows.push({
        id: `row-${i}`,
        name: names[Math.floor(Math.random() * names.length)],
        email: `user${i}@example.com`,
        phone: `555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        city: cities[Math.floor(Math.random() * cities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        joined: new Date(Date.now() - Math.random() * 31536000000).toISOString().split('T')[0],
      });
    }
  } else if (fileName.includes('inventory')) {
    columns = ['id', 'sku', 'item', 'stock', 'price', 'category', 'supplier'];
    const items = ['Widget A', 'Component B', 'Part C', 'Module D', 'Unit E'];
    const categories = ['Electronics', 'Hardware', 'Software', 'Accessories'];
    const suppliers = ['Supplier Co', 'Global Parts', 'Tech Supply', 'Direct Wholesale'];

    for (let i = 1; i <= 20; i++) {
      rows.push({
        id: `row-${i}`,
        sku: `SKU-${String(i).padStart(5, '0')}`,
        item: items[Math.floor(Math.random() * items.length)],
        stock: Math.floor(Math.random() * 500),
        price: Math.floor(Math.random() * 200) + 20,
        category: categories[Math.floor(Math.random() * categories.length)],
        supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      });
    }
  } else if (fileName.includes('financial')) {
    columns = ['id', 'transaction', 'amount', 'type', 'account', 'date', 'balance'];
    const types = ['Debit', 'Credit', 'Transfer'];
    const accounts = ['Checking', 'Savings', 'Business', 'Investment'];
    let balance = 50000;

    for (let i = 1; i <= 35; i++) {
      const amount = Math.floor(Math.random() * 5000) + 100;
      const type = types[Math.floor(Math.random() * types.length)];
      balance += type === 'Credit' ? amount : -amount;

      rows.push({
        id: `row-${i}`,
        transaction: `TXN-${String(i).padStart(6, '0')}`,
        amount,
        type,
        account: accounts[Math.floor(Math.random() * accounts.length)],
        date: new Date(Date.now() - Math.random() * 5184000000).toISOString().split('T')[0],
        balance,
      });
    }
  } else {
    columns = ['id', 'name', 'value', 'category', 'date', 'status'];
    for (let i = 1; i <= 15; i++) {
      rows.push({
        id: `row-${i}`,
        name: `Item ${i}`,
        value: Math.floor(Math.random() * 1000),
        category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        date: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
        status: ['Active', 'Pending', 'Completed'][Math.floor(Math.random() * 3)],
      });
    }
  }

  mockData.set(fileId, { columns, rows });
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
