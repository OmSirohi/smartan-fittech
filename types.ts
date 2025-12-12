export interface Keypoint {
  x: number;
  y: number;
  z: number;
  visibility: number;
  name?: string;
}

export interface PoseData {
  id: string; // SQL Primary Key
  timestamp: string;
  pose_name: string;
  confidence: number;
  keypoints: Keypoint[]; // Stored as JSONB in SQL
}

export interface ImageData {
  id: string; // MongoDB _id
  sql_ref_id: string; // Foreign key to SQL
  mime_type: string;
  data_base64: string; // Stored in NoSQL
  created_at: string;
}

export interface SystemLog {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  module: 'API' | 'CRON' | 'DB' | 'EMAIL';
  message: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCANNER = 'SCANNER',
  DATABASE = 'DATABASE',
  SETTINGS = 'SETTINGS',
  DELIVERABLES = 'DELIVERABLES'
}