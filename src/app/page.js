'use client';

import { useState } from 'react';
import styles from './page.module.css';
import { saveAs } from 'file-saver';

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('docx'); // Default to DOCX
  const [fileFormat, setFileFormat] = useState('docx');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please upload a PDF file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process the PDF');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred while processing the file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadText = () => {
    if (!result) return;

    const content = `Grade: ${result.grade || 'N/A'}
Chapter Name: ${result.chapterName || 'N/A'}
Introduction to the chapter: ${result.introduction || 'N/A'}
Assets required: ${result.assets || 'N/A'}
Methodology: ${result.methodology || 'N/A'}`;

    const blob = new Blob([content], { type: 'text/plain' });
    saveAs(blob, `${result.chapterName || 'chapter'}_template.txt`);
  };

  const handleDownloadDocx = async () => {
    if (!result) return;

    try {
      setLoading(true);
      
      // Use the template-based endpoint
      const response = await fetch('/api/generate-from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error('Failed to generate DOCX file');
      }

      // Get the blob directly from the response
      const blob = await response.blob();
      
      // Download the file
      saveAs(blob, `${result.chapterName || 'chapter'}_template.docx`);
    } catch (err) {
      setError(err.message || 'An error occurred while generating the DOCX file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    
    try {
      setLoading(true);
      
      // Always use generate-from-template since PDF conversion requires LibreOffice
      const endpoint = '/api/generate-from-template';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate template file`);
      }

      const blob = await response.blob();
      saveAs(blob, `${result.chapterName || 'chapter'}_template.docx`);
    } catch (err) {
      setError(err.message || `An error occurred while generating the template file`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>VR Template Generator</h1>
        <p className={styles.description}>
          Upload a textbook chapter PDF to generate a VR template
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fileInput}>
            <input 
              type="file" 
              onChange={handleFileChange} 
              accept="application/pdf" 
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload">
              {file ? file.name : 'Choose a PDF file'}
            </label>
          </div>

          <button 
            type="submit" 
            className={styles.button}
            disabled={loading || !file}
          >
            {loading ? 'Processing...' : 'Generate Template'}
          </button>
        </form>

        {error && <div className={styles.error}>{error}</div>}

        {result && (
          <div className={styles.result}>
            <h2>Generated Template</h2>
            <div className={styles.templateContent}>
              <p><strong>Grade:</strong> {result.grade || 'N/A'}</p>
              <p><strong>Chapter Name:</strong> {result.chapterName || 'N/A'}</p>
              <p><strong>Introduction:</strong> {result.introduction || 'N/A'}</p>
              <p><strong>Assets Required:</strong> {result.assets || 'N/A'}</p>
              <p><strong>Methodology:</strong> {result.methodology || 'N/A'}</p>
            </div>
            
            <div className={styles.downloadOptions}>
              <div className={styles.formatSelector}>
                <label>File Format:</label>
                <select 
                  value={fileFormat} 
                  onChange={(e) => setFileFormat(e.target.value)}
                  className={styles.formatSelect}
                >
                  <option value="docx">DOCX</option>
                </select>
              </div>
              
              <button 
                onClick={handleDownload}
                className={styles.downloadButton}
                disabled={loading}
              >
                {loading ? 'Generating...' : `Download Template (${fileFormat.toUpperCase()})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
