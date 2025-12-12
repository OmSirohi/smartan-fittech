import React, { useState, useRef } from 'react';
import { Camera, Upload, RefreshCw, Cpu, Database, Save } from 'lucide-react';
import { analyzePoseWithGemini } from '../services/geminiService';
import { PoseData, ImageData, SystemLog } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ScannerProps {
  onDataCaptured: (pose: PoseData, image: ImageData) => void;
  // Fix: Omit 'timestamp' as it is handled by the parent component
  addLog: (log: Omit<SystemLog, 'id' | 'timestamp'>) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onDataCaptured, addLog }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PoseData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setResult(null); // Reset previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!imagePreview) return;

    setIsProcessing(true);
    addLog({ level: 'INFO', module: 'API', message: 'Sending image to MediaPipe extraction service (Gemini)...' });

    try {
      // Strip metadata for API call
      const base64Data = imagePreview.split(',')[1];
      const analysis = await analyzePoseWithGemini(base64Data);
      
      const newPoseId = uuidv4();
      
      const poseData: PoseData = {
        id: newPoseId,
        timestamp: new Date().toISOString(),
        pose_name: analysis.pose_name,
        confidence: analysis.confidence,
        keypoints: analysis.keypoints
      };

      const imageData: ImageData = {
        id: uuidv4(),
        sql_ref_id: newPoseId,
        mime_type: 'image/jpeg',
        data_base64: imagePreview,
        created_at: new Date().toISOString()
      };

      setResult(poseData);
      onDataCaptured(poseData, imageData);
      addLog({ level: 'SUCCESS', module: 'API', message: `Pose extracted: ${analysis.pose_name} (${(analysis.confidence * 100).toFixed(1)}%)` });

    } catch (error) {
      addLog({ level: 'ERROR', module: 'API', message: 'Failed to extract pose data.' });
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Input Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col">
        <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-400" />
          Input Source
        </h2>
        
        <div className="flex-1 bg-gray-900 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center relative overflow-hidden group">
          {imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-6">
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Upload an image to start extraction</p>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Select Image
          </button>
          <button 
            onClick={processImage}
            disabled={!imagePreview || isProcessing}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              !imagePreview || isProcessing 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'
            }`}
          >
            {isProcessing ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              <><Cpu className="w-4 h-4" /> Extract Keypoints</>
            )}
          </button>
        </div>
      </div>

      {/* Output Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col">
        <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          Extracted Data (JSON)
        </h2>
        
        <div className="flex-1 bg-gray-900 rounded-lg border border-gray-700 p-4 font-mono text-xs text-emerald-400 overflow-y-auto max-h-[500px]">
          {result ? (
            <pre>{JSON.stringify(result, null, 2)}</pre>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600">
              <p>Waiting for extraction...</p>
            </div>
          )}
        </div>
        
        {result && (
          <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-900 rounded-lg flex items-center gap-3">
            <Save className="w-5 h-5 text-emerald-500" />
            <div className="text-sm">
              <p className="text-emerald-300 font-medium">Data Persisted</p>
              <p className="text-emerald-600">SQL: Keypoints stored. NoSQL: Image stored.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;