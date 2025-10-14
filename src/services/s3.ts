import AWS from 'aws-sdk';

class S3Service {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    AWS.config.update({
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    });

    this.s3 = new AWS.S3();
    this.bucket = import.meta.env.VITE_AWS_S3_BUCKET || '';
  }

  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ key: string; url: string }> {
    const key = `uploads/${Date.now()}-${file.name}`;

    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: file.type,
    };

    return new Promise((resolve, reject) => {
      this.s3
        .upload(params)
        .on('httpUploadProgress', (progress) => {
          if (onProgress && progress.total) {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            onProgress(percentage);
          }
        })
        .send((err: Error | null, data: AWS.S3.ManagedUpload.SendData) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              key,
              url: data.Location,
            });
          }
        });
    });
  }

  async deleteFile(key: string): Promise<void> {
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: this.bucket,
      Key: key,
    };

    await this.s3.deleteObject(params).promise();
  }
}

export default new S3Service();
