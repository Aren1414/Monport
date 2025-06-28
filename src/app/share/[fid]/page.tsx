'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface FileData {
  name: string;
  description: string;
  url: string;
}

export default function SharePage() {
  const params = useParams();
  const [fileData, setFileData] = useState<FileData | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      if (!params?.fid) return;

      try {
        const response = await fetch(`/api/files/${params.fid}`);
        const data = await response.json();
        setFileData(data as FileData); // Type assertion
      } catch (error) {
        console.error('Failed to fetch file:', error);
      }
    };

    fetchFile();
  }, [params?.fid]);

  if (!fileData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Shared File</h1>
      <p><strong>File Name:</strong> {fileData.name}</p>
      <p><strong>Description:</strong> {fileData.description}</p>
      <a href={fileData.url} target="_blank" rel="noopener noreferrer">
        Download
      </a>
    </div>
  );
}
