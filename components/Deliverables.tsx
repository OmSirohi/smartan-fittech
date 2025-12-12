import React, { useState } from 'react';
import { FileCode, FileJson, FileText, Copy, Check, Terminal, Database } from 'lucide-react';

const FILES: Record<string, { lang: string, icon: any, content: string }> = {
  'server.js': {
    lang: 'javascript',
    icon: FileCode,
    content: `const express = require('express');
const cron = require('node-cron');
const archiver = require('archiver');
const fs = require('fs');
const { spawn } = require('child_process');
const sgMail = require('@sendgrid/mail');
const { Client } = require('pg');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json({ limit: '50mb' }));

// Database Connections (Mock)
const pgClient = new Client({ connectionString: process.env.DATABASE_URL });
const mongoClient = new MongoClient(process.env.MONGO_URI);

// A. MediaPipe Keypoint Extraction API
app.post('/extract-pose', async (req, res) => {
  const { image_base64 } = req.body;
  
  if (!image_base64) return res.status(400).json({ error: 'Missing image' });

  // 1. Save base64 to temp file for Python script
  const tempPath = './temp/input.jpg';
  // In production, ensure unique filenames or use streams
  fs.writeFileSync(tempPath, image_base64, 'base64');

  // 2. Call Python MediaPipe Script
  const python = spawn('python3', ['extractor.py', tempPath]);
  
  let dataToSend = '';
  python.stdout.on('data', (data) => { dataToSend += data.toString(); });
  
  python.on('close', async (code) => {
    try {
      // Parse Python Output
      const result = JSON.parse(dataToSend);
      
      if (result.error) throw new Error(result.error);

      // 3. Store Keypoints in SQL
      const sqlRes = await pgClient.query(
        'INSERT INTO poses (pose_name, confidence, keypoints) VALUES ($1, $2, $3) RETURNING id',
        [result.pose_name, result.confidence, JSON.stringify(result.keypoints)]
      );
      const sqlId = sqlRes.rows[0].id;

      // 4. Store Image in NoSQL (MongoDB)
      await mongoClient.db('pose_db').collection('images').insertOne({
        sql_ref_id: sqlId,
        data: image_base64,
        created_at: new Date()
      });

      res.json({ success: true, id: sqlId, data: result });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Processing or Storage failed' });
    }
  });
});

// B. Cron Job: Daily Backup at 11:59 PM
cron.schedule('59 23 * * *', async () => {
  console.log('Starting daily backup...');
  
  const dateStr = new Date().toISOString().split('T')[0];
  const zipPath = \`./backups/backup-\${dateStr}.zip\`;
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);

  // Dump SQL Data
  // (In real prod, pg_dump is preferred, but this demonstrates programmatic access)
  const sqlData = await pgClient.query('SELECT * FROM poses');
  archive.append(JSON.stringify(sqlData.rows, null, 2), { name: 'sql_dump.json' });

  // Dump NoSQL Data
  const mongoData = await mongoClient.db('pose_db').collection('images').find().toArray();
  archive.append(JSON.stringify(mongoData, null, 2), { name: 'mongo_dump.json' });

  await archive.finalize();
  
  // Wait for file stream to close then send email
  output.on('close', () => {
      sendBackupEmail(zipPath, dateStr);
  });
});

async function sendBackupEmail(filePath, date) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const attachment = fs.readFileSync(filePath).toString('base64');
  
  await sgMail.send({
    to: 'admin@posemaster.com',
    from: 'system@posemaster.com',
    subject: \`Daily DB Backup - \${date}\`,
    text: 'Please find the daily database backup attached.',
    attachments: [{
      content: attachment,
      filename: \`backup-\${date}.zip\`,
      type: 'application/zip',
      disposition: 'attachment'
    }]
  });
  console.log('Backup email sent.');
}

app.listen(3000, () => console.log('Server running on port 3000'));`
  },
  'extractor.py': {
    lang: 'python',
    icon: Terminal,
    content: `import sys
import cv2
import mediapipe as mp
import json

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=True, 
    model_complexity=2, 
    min_detection_confidence=0.5
)

def analyze_image(image_path):
    try:
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Image not found")

        # Convert to RGB (MediaPipe requirement)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process
        results = pose.process(image_rgb)
        
        if not results.pose_landmarks:
            print(json.dumps({"error": "No pose detected"}))
            return

        # Extract Keypoints (33 points)
        keypoints = []
        for landmark in results.pose_landmarks.landmark:
            keypoints.append({
                "x": landmark.x,
                "y": landmark.y,
                "z": landmark.z,
                "visibility": landmark.visibility
            })

        # Construct Output
        output = {
            "pose_name": "Detected Pose", # Add classification logic here if needed
            "confidence": 0.95,           # Aggregate score logic here
            "keypoints": keypoints
        }
        
        # Print JSON to stdout for Node.js to capture
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        analyze_image(sys.argv[1])
    else:
        print(json.dumps({"error": "No image path provided"}))`
  },
  'schema.sql': {
    lang: 'sql',
    icon: Database,
    content: `-- PostgreSQL Schema Definition

-- Table to store pose analysis results
CREATE TABLE IF NOT EXISTS poses (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    pose_name VARCHAR(255),
    confidence FLOAT,
    keypoints JSONB -- Storing 33 keypoints as structured JSON
);

-- Index for faster querying by date (useful for daily backups)
CREATE INDEX idx_poses_created_at ON poses(created_at);

-- Example Insert
-- INSERT INTO poses (pose_name, confidence, keypoints) VALUES ('Standing', 0.98, '[{"x":0.5...}]');`
  },
  'mongo_export.json': {
    lang: 'json',
    icon: FileJson,
    content: `[
  {
    "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9c0d1" },
    "sql_ref_id": 1,
    "mime_type": "image/jpeg",
    "data_base64": "/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "created_at": { "$date": "2023-09-01T12:00:00Z" },
    "metadata": {
        "original_filename": "capture_001.jpg",
        "size_bytes": 102400
    }
  },
  {
    "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9c0d2" },
    "sql_ref_id": 2,
    "mime_type": "image/png",
    "data_base64": "iVBORw0KGgoAAAANSUhEUgAAAAE...",
    "created_at": { "$date": "2023-09-01T12:05:00Z" }
  }
]`
  },
  'README.md': {
    lang: 'markdown',
    icon: FileText,
    content: `# PoseMaster AI Backend System

## 1. Setup Instructions

### Prerequisites
* Node.js v18+
* Python 3.9+
* PostgreSQL & MongoDB instances
* SendGrid API Key

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/company/posemaster-backend.git
   cd posemaster-backend
   \`\`\`

2. **Install Node.js dependencies**
   \`\`\`bash
   npm install express node-cron archiver pg mongodb @sendgrid/mail
   \`\`\`

3. **Install Python dependencies**
   \`\`\`bash
   pip install mediapipe opencv-python
   \`\`\`

4. **Environment Configuration**
   Create a \`.env\` file in the root directory:
   \`\`\`env
   DATABASE_URL=postgresql://user:pass@localhost:5432/posedb
   MONGO_URI=mongodb://localhost:27017
   SENDGRID_API_KEY=SG.your_key_here
   \`\`\`

## 2. API Usage

### Extract Pose
* **Endpoint:** \`POST /extract-pose\`
* **Headers:** \`Content-Type: application/json\`
* **Body:**
  \`\`\`json
  {
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
  }
  \`\`\`
* **Response:**
  \`\`\`json
  {
    "success": true,
    "id": 15,
    "data": { 
      "pose_name": "Standing",
      "confidence": 0.98,
      "keypoints": [...] 
    }
  }
  \`\`\`

## 3. Cron Configuration
The system uses \`node-cron\` configured in \`server.js\`.
* **Schedule:** \`59 23 * * *\` (Daily at 11:59 PM)
* **Action:** 
    1. Connects to SQL and MongoDB.
    2. Exports all data to JSON files.
    3. Compresses files into a ZIP archive.
    4. Emails the ZIP to the administrator.

## 4. Testing
Run the server:
\`\`\`bash
node server.js
\`\`\`
Use Postman or the provided frontend simulator to send requests.`
  }
};

const Deliverables: React.FC = () => {
  const [activeFile, setActiveFile] = useState('server.js');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(FILES[activeFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100 rounded-xl overflow-hidden border border-gray-700">
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileCode className="w-5 h-5 text-blue-400" />
          Project Deliverables
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Source code deliverables generated for the intern task.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800/50 border-r border-gray-700 overflow-y-auto">
          {Object.entries(FILES).map(([filename, file]) => {
            const Icon = file.icon;
            return (
              <button
                key={filename}
                onClick={() => setActiveFile(filename)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  activeFile === filename
                    ? 'bg-blue-600/20 text-blue-300 border-r-2 border-blue-500'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {filename}
              </button>
            );
          })}
        </div>

        {/* Code Viewer */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-sm font-mono text-gray-300">{activeFile}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-4">
            <pre className="font-mono text-sm leading-relaxed text-gray-300">
              <code>{FILES[activeFile].content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deliverables;
