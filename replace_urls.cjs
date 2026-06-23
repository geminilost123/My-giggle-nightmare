const fs = require('fs');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/https:\/\/api\.x\.ai/g, '/api/proxy/xai');
  content = content.replace(/https:\/\/api\.atlascloud\.ai/g, '/api/proxy/atlas');
  content = content.replace(/https:\/\/api\.wavespeed\.ai/g, '/api/proxy/wavespeed');
  
  // Strip Authorization headers
  content = content.replace(/Authorization:\s*`Bearer \$\{.*?}`/g, '');
  content = content.replace(/,\s*Authorization:\s*`Bearer \$\{.*?}`/g, '');
  content = content.replace(/headers:\s*{\s*('Content-Type':\s*'application\/json')\s*,\s*}/g, 'headers: { $1 }');
  content = content.replace(/headers:\s*{\s*}/g, 'headers: {}');

  fs.writeFileSync(file, content);
}

processFile('./src/api.ts');
processFile('./src/App.tsx');
processFile('./src/components/Modals.tsx');
