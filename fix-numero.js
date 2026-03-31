const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'QueueManagement.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace result.queue_id with result.numero
content = content.replace('numero: result.queue_id,', 'numero: result.numero,');

// Also fix the API type
const apiPath = path.join(__dirname, 'frontend', 'src', 'services', 'api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');
apiContent = apiContent.replace(
  'addToQueue: async (data: { patient_id: number; service_id: number; priorite?: string }): Promise<{ queue_id: number }> => {',
  'addToQueue: async (data: { patient_id: number; service_id: number; priorite?: string }): Promise<{ queue_id: number; numero: number }> => {'
);

// Write both files
fs.writeFileSync(filePath, content, 'utf8');
fs.writeFileSync(apiPath, apiContent, 'utf8');

console.log('Files updated successfully!');
console.log('QueueManagement.tsx - Changed result.queue_id to result.numero');
console.log('api.ts - Updated type definition');