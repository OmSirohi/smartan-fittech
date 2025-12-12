import React, { useState } from 'react';
import { Database, FileImage, Table, Eye, X } from 'lucide-react';
import { PoseData, ImageData } from '../types';

interface DataViewProps {
  poses: PoseData[];
  images: ImageData[];
}

const DataView: React.FC<DataViewProps> = ({ poses, images }) => {
  const [activeTab, setActiveTab] = useState<'SQL' | 'NOSQL'>('SQL');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4 border-b border-gray-700 pb-4">
        <button
          onClick={() => setActiveTab('SQL')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
            activeTab === 'SQL' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Table className="w-4 h-4" />
          SQL Database (Keypoints)
        </button>
        <button
          onClick={() => setActiveTab('NOSQL')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
            activeTab === 'NOSQL' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <FileImage className="w-4 h-4" />
          NoSQL Database (Images)
        </button>
      </div>

      <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col">
        {activeTab === 'SQL' ? (
          <div className="overflow-auto flex-1">
             <table className="w-full text-left border-collapse">
               <thead className="bg-gray-900 sticky top-0">
                 <tr>
                   <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">ID</th>
                   <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">Timestamp</th>
                   <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">Pose</th>
                   <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">Confidence</th>
                   <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">Keypoints (Count)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-700">
                 {poses.map((pose) => (
                   <tr key={pose.id} className="hover:bg-gray-700/50">
                     <td className="p-4 text-sm font-mono text-gray-300">{pose.id.slice(0, 8)}...</td>
                     <td className="p-4 text-sm text-gray-300">{new Date(pose.timestamp).toLocaleString()}</td>
                     <td className="p-4 text-sm text-white font-medium">{pose.pose_name}</td>
                     <td className="p-4 text-sm text-gray-300">{(pose.confidence * 100).toFixed(1)}%</td>
                     <td className="p-4 text-sm text-gray-300">{pose.keypoints.length}</td>
                   </tr>
                 ))}
                 {poses.length === 0 && (
                   <tr>
                     <td colSpan={5} className="p-8 text-center text-gray-500">No records found in PostgreSQL.</td>
                   </tr>
                 )}
               </tbody>
             </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-auto flex-1">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-emerald-500 transition-colors">
                <img src={img.data_base64} alt="Stored" className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                    onClick={() => setSelectedImage(img)}
                    className="p-2 bg-emerald-600 rounded-full text-white hover:bg-emerald-500"
                   >
                     <Eye className="w-5 h-5" />
                   </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-xs text-gray-400 truncate font-mono">
                  ID: {img.id.slice(0, 8)}
                </div>
              </div>
            ))}
            {images.length === 0 && (
               <div className="col-span-full text-center text-gray-500 py-12">No documents found in MongoDB.</div>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-600 max-w-2xl w-full flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-white font-medium">Document Viewer</h3>
              <button onClick={() => setSelectedImage(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/50">
              <img src={selectedImage.data_base64} alt="Full view" className="max-h-[60vh] object-contain" />
            </div>
            <div className="p-4 bg-gray-900 font-mono text-xs text-emerald-400 overflow-auto max-h-[150px]">
              <pre>{JSON.stringify(selectedImage, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataView;
