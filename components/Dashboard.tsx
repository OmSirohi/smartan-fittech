import React from 'react';
import { Activity, Database, Server, Clock, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { PoseData, ImageData, SystemLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  poses: PoseData[];
  images: ImageData[];
  logs: SystemLog[];
  lastBackup: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ poses, images, logs, lastBackup }) => {
  // Calculate stats
  const totalScans = poses.length;
  const avgConfidence = totalScans > 0 
    ? (poses.reduce((acc, curr) => acc + curr.confidence, 0) / totalScans * 100).toFixed(1) 
    : 0;

  // Mock data for the chart
  const data = [
    { name: 'Mon', scans: 4 },
    { name: 'Tue', scans: 7 },
    { name: 'Wed', scans: 2 },
    { name: 'Thu', scans: 10 },
    { name: 'Fri', scans: 5 },
    { name: 'Sat', scans: 8 },
    { name: 'Sun', scans: totalScans }, // Dynamically update today
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Extractions</p>
              <h3 className="text-3xl font-bold text-white mt-2">{totalScans}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-blue-400 text-sm mt-4 flex items-center gap-1">
            <Server className="w-3 h-3" /> Node.js Backend Active
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium">SQL Records</p>
              <h3 className="text-3xl font-bold text-white mt-2">{totalScans}</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Database className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">PostgreSQL / MySQL</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium">NoSQL Documents</p>
              <h3 className="text-3xl font-bold text-white mt-2">{images.length}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Database className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">MongoDB Storage</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium">Avg Confidence</p>
              <h3 className="text-3xl font-bold text-white mt-2">{avgConfidence}%</h3>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">MediaPipe Quality</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-6">Weekly Extraction Activity</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                  cursor={{ fill: '#374151' }}
                />
                <Bar dataKey="scans" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Logs & Backup Status */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
          
          <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-medium">Cron Job (Backup)</span>
              <span className="px-2 py-0.5 rounded text-xs bg-green-900 text-green-300 border border-green-800">Active</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Clock className="w-4 h-4" />
              <span>Next Run: Today, 11:59 PM</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
              <Download className="w-3 h-3" />
              <span>Last Backup: {lastBackup || 'Never'}</span>
            </div>
          </div>

          <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Logs</h4>
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[250px] pr-2 custom-scrollbar">
            {logs.slice().reverse().map((log) => (
              <div key={log.id} className="flex gap-3 text-sm p-2 rounded hover:bg-gray-700/50 transition-colors">
                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  log.level === 'INFO' ? 'bg-blue-500' :
                  log.level === 'SUCCESS' ? 'bg-green-500' :
                  log.level === 'WARN' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="text-xs font-bold text-gray-400">[{log.module}]</span>
                  </div>
                  <p className="text-gray-300 leading-snug">{log.message}</p>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-gray-500 text-sm italic text-center py-4">No system logs yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
