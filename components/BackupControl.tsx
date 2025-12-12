import React, { useState } from 'react';
import { Archive, Mail, Clock, Download, Check, RefreshCw } from 'lucide-react';
import { PoseData, ImageData, SystemLog } from '../types';

interface BackupControlProps {
  poses: PoseData[];
  images: ImageData[];
  onBackupComplete: (timestamp: string) => void;
  // Fix: Omit 'timestamp' as it is handled by the parent component
  addLog: (log: Omit<SystemLog, 'id' | 'timestamp'>) => void;
}

const BackupControl: React.FC<BackupControlProps> = ({ poses, images, onBackupComplete, addLog }) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastEmailSent, setLastEmailSent] = useState<string | null>(null);

  const performManualBackup = async () => {
    setIsBackingUp(true);
    addLog({ level: 'INFO', module: 'CRON', message: 'Manual backup triggered by user.' });

    try {
      // 1. Simulate Archiver (zipping) by creating a JSON Blob of all data
      addLog({ level: 'INFO', module: 'DB', message: `Exporting ${poses.length} SQL records and ${images.length} NoSQL documents...` });
      
      const backupData = {
        metadata: {
          version: '1.0',
          generated_at: new Date().toISOString(),
          source: 'PoseMaster Backend',
        },
        sql_dump: {
          table: 'pose_keypoints',
          rows: poses
        },
        nosql_dump: {
          collection: 'images',
          documents: images
        }
      };

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      const filename = `backup-${new Date().toISOString().split('T')[0]}.json`; // Using JSON instead of ZIP for browser compat
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addLog({ level: 'SUCCESS', module: 'DB', message: `Archive created: ${filename}` });

      // 2. Simulate SendGrid Email
      addLog({ level: 'INFO', module: 'EMAIL', message: 'Connecting to SendGrid SMTP Relay...' });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addLog({ level: 'SUCCESS', module: 'EMAIL', message: `Email sent to admin@posemaster.com with attachment ${filename}` });
      
      const now = new Date().toLocaleString();
      setLastEmailSent(now);
      onBackupComplete(now);

    } catch (error) {
      addLog({ level: 'ERROR', module: 'CRON', message: 'Backup process failed.' });
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Archive className="w-5 h-5 text-yellow-500" />
          Backup & Retention Configuration
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <label className="block text-sm font-medium text-gray-400 mb-2">Cron Job Schedule (node-cron)</label>
              <div className="flex items-center gap-3">
                <code className="bg-black text-green-400 px-3 py-1 rounded font-mono text-sm">59 23 * * *</code>
                <span className="text-gray-500 text-sm">Runs daily at 11:59 PM</span>
              </div>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <label className="block text-sm font-medium text-gray-400 mb-2">Storage Strategy</label>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> SQL (Postgres) for structured Keypoints</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> NoSQL (Mongo) for Blob/Image Data</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Archiver for ZIP compression</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-4 border-l border-gray-700 pl-6">
             <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Email Notification</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    SendGrid integration configured.
                    <br/>
                    Template: <span className="text-blue-300">Daily DB Backup - &#123;&#123;DATE&#125;&#125;</span>
                  </p>
                  {lastEmailSent && (
                    <p className="text-xs text-green-400 mt-2">Last sent: {lastEmailSent}</p>
                  )}
                </div>
             </div>
             
             <button
              onClick={performManualBackup}
              disabled={isBackingUp}
              className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                isBackingUp 
                  ? 'bg-yellow-600/50 text-yellow-200 cursor-wait' 
                  : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20'
              }`}
            >
              {isBackingUp ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Running Cron Job...</>
              ) : (
                <><Download className="w-5 h-5" /> Run Manual Backup Now</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupControl;