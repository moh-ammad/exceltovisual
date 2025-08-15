import { useState } from 'react';
import { UploadCloud } from 'lucide-react';

const UploadPage = () => {
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState(null);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFileName(uploadedFile.name);
      simulateUploadProgress();
    }
  };

  const simulateUploadProgress = () => {
    setProgress(0);
    let percent = 0;
    const interval = setInterval(() => {
      percent += 10;
      setProgress(percent);
      if (percent >= 100) clearInterval(interval);
    }, 200);
  };

  return (
    <div className="min-h-screen px-6 py-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <h2 className="text-3xl font-semibold mb-8">Upload Your Excel File</h2>

      <div className="max-w-2xl mx-auto border-dashed border-2 border-gray-400 dark:border-gray-600 p-10 rounded-md text-center">
        <UploadCloud size={48} className="mx-auto text-blue-600 dark:text-blue-400 mb-4" />
        <p className="text-lg font-medium mb-1">
          Drag and drop your <code>.xlsx</code> file here
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or click to select file</p>

        <label className="inline-block bg-blue-600 text-white px-6 py-2 rounded cursor-pointer hover:bg-blue-700 transition">
          Select File
          <input type="file" hidden accept=".xlsx" onChange={handleFileChange} />
        </label>

        {fileName && (
          <div className="mt-6 text-left">
            <p className="mb-2 text-sm font-medium">{fileName}</p>
            <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded">
              <div
                className="h-2 bg-blue-600 dark:bg-blue-400 rounded transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress >= 100 && (
              <p className="text-green-600 text-sm mt-2">Upload complete!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
