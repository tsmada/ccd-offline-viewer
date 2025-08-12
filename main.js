const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

let mainWindow;
const isDev = process.argv.includes('--dev');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    icon: path.join(__dirname, 'renderer/assets/icon.png'),
    show: false
  });

  // Load the renderer
  mainWindow.loadFile('renderer/index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Set up menu
  setupMenu();
}

function setupMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open CCD/CDA',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open-file');
          }
        },
        {
          label: 'Save as PDF',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-pdf');
          }
        },
        { type: 'separator' },
        {
          label: 'Export',
          submenu: [
            {
              label: 'Export as JSON',
              click: () => mainWindow.webContents.send('menu-export-json')
            },
            {
              label: 'Export as CSV',
              click: () => mainWindow.webContents.send('menu-export-csv')
            }
          ]
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Theme',
          submenu: [
            {
              label: 'Classic Winamp',
              click: () => mainWindow.webContents.send('menu-theme', 'winamp')
            },
            {
              label: 'Healthcare Blue',
              click: () => mainWindow.webContents.send('menu-theme', 'healthcare')
            },
            {
              label: 'Dark Mode',
              click: () => mainWindow.webContents.send('menu-theme', 'dark')
            },
            {
              label: 'High Contrast',
              click: () => mainWindow.webContents.send('menu-theme', 'contrast')
            },
            {
              label: 'Vaporwave',
              click: () => mainWindow.webContents.send('menu-theme', 'vapor')
            },
            {
              label: 'Matrix',
              click: () => mainWindow.webContents.send('menu-theme', 'matrix')
            }
          ]
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About CCD Viewer',
              message: 'CCD Viewer',
              detail: 'Version 1.0.0\n\nA modern, HIPAA-compliant Continuity of Care Document viewer.\n\nBuilt with Electron.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'CCD/CDA Documents', extensions: ['xml', 'ccd', 'cda'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('save-file-dialog', async (event, defaultName, filters) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: filters
  });
  return result;
});

ipcMain.handle('read-file', async (event, filePath) => {
  const fs = require('fs').promises;
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  const fs = require('fs').promises;
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('parse-xml', async (event, xmlContent) => {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      removeNSPrefix: true,
      processEntities: false
    });
    
    const result = parser.parse(xmlContent);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-pdf', async (event, filename, documentData) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename || 'ccd-document.pdf',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    // Create a new window for PDF rendering (hidden)
    const pdfWindow = new BrowserWindow({
      width: 800,
      height: 1200,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });
    
    // Generate PDF content HTML
    const pdfContent = generatePDFContent(documentData);
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(pdfContent)}`);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate PDF
    const pdfBuffer = await pdfWindow.webContents.printToPDF({
      format: 'A4',
      printBackground: true,
      margin: {
        top: 0.5,
        bottom: 0.5,
        left: 0.5,
        right: 0.5
      }
    });
    
    // Close PDF window
    pdfWindow.close();
    
    // Write PDF to file
    const fs = require('fs').promises;
    await fs.writeFile(result.filePath, pdfBuffer);
    
    return { success: true, filePath: result.filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

function generatePDFContent(documentData) {
  if (!documentData) {
    return '<html><body><h1>No document data available</h1></body></html>';
  }
  
  const { header, patient, allergies, medications, problems, procedures, encounters, vitalSigns, labResults } = documentData;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CCD Document</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    
    h1 {
      color: #2563eb;
      font-size: 18pt;
      margin-bottom: 20px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
    }
    
    h2 {
      color: #1e40af;
      font-size: 14pt;
      margin: 20px 0 10px 0;
      page-break-after: avoid;
    }
    
    h3 {
      color: #1e3a8a;
      font-size: 12pt;
      margin: 15px 0 8px 0;
    }
    
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .info-item {
      margin-bottom: 8px;
    }
    
    .label {
      font-weight: bold;
      color: #374151;
    }
    
    .value {
      color: #6b7280;
      margin-left: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 10pt;
    }
    
    th, td {
      border: 1px solid #d1d5db;
      padding: 6px;
      text-align: left;
      vertical-align: top;
    }
    
    th {
      background-color: #f3f4f6;
      font-weight: bold;
      color: #374151;
    }
    
    .no-data {
      color: #9ca3af;
      font-style: italic;
    }
    
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <h1>Continuity of Care Document (CCD)</h1>
  
  ${header ? `
  <div class="section">
    <h2>Document Information</h2>
    <div class="info-grid">
      ${header.title ? `<div class="info-item"><span class="label">Title:</span><span class="value">${header.title}</span></div>` : ''}
      ${header.effectiveTime ? `<div class="info-item"><span class="label">Date:</span><span class="value">${formatDate(header.effectiveTime)}</span></div>` : ''}
      ${header.id ? `<div class="info-item"><span class="label">Document ID:</span><span class="value">${header.id}</span></div>` : ''}
      ${header.setId ? `<div class="info-item"><span class="label">Set ID:</span><span class="value">${header.setId}</span></div>` : ''}
    </div>
  </div>` : ''}
  
  ${patient ? `
  <div class="section">
    <h2>Patient Information</h2>
    <div class="info-grid">
      ${patient.name?.full ? `<div class="info-item"><span class="label">Name:</span><span class="value">${patient.name.full}</span></div>` : ''}
      ${patient.mrn ? `<div class="info-item"><span class="label">MRN:</span><span class="value">${patient.mrn}</span></div>` : ''}
      ${patient.dateOfBirth ? `<div class="info-item"><span class="label">Date of Birth:</span><span class="value">${formatDate(patient.dateOfBirth)}</span></div>` : ''}
      ${patient.gender ? `<div class="info-item"><span class="label">Gender:</span><span class="value">${patient.gender}</span></div>` : ''}
      ${patient.race ? `<div class="info-item"><span class="label">Race:</span><span class="value">${patient.race}</span></div>` : ''}
      ${patient.ethnicity ? `<div class="info-item"><span class="label">Ethnicity:</span><span class="value">${patient.ethnicity}</span></div>` : ''}
    </div>
  </div>` : ''}
  
  ${allergies?.length > 0 ? `
  <div class="section">
    <h2>Allergies</h2>
    <table>
      <tr>
        <th>Substance</th>
        <th>Reaction</th>
        <th>Severity</th>
        <th>Status</th>
        <th>Onset Date</th>
      </tr>
      ${allergies.map(allergy => `
        <tr>
          <td>${allergy.substance || 'N/A'}</td>
          <td>${allergy.reaction || 'N/A'}</td>
          <td>${allergy.severity || 'N/A'}</td>
          <td>${allergy.status || 'N/A'}</td>
          <td>${formatDate(allergy.onsetDate) || 'N/A'}</td>
        </tr>
      `).join('')}
    </table>
  </div>` : ''}
  
  ${medications?.length > 0 ? `
  <div class="section">
    <h2>Medications</h2>
    <table>
      <tr>
        <th>Medication</th>
        <th>Dosage</th>
        <th>Frequency</th>
        <th>Route</th>
        <th>Status</th>
        <th>Start Date</th>
      </tr>
      ${medications.map(med => `
        <tr>
          <td>${med.name || 'N/A'}</td>
          <td>${med.dosage || 'N/A'}</td>
          <td>${med.frequency || 'N/A'}</td>
          <td>${med.route || 'N/A'}</td>
          <td>${med.status || 'N/A'}</td>
          <td>${formatDate(med.startDate) || 'N/A'}</td>
        </tr>
      `).join('')}
    </table>
  </div>` : ''}
  
  ${problems?.length > 0 ? `
  <div class="section">
    <h2>Problems</h2>
    <table>
      <tr>
        <th>Problem</th>
        <th>Code</th>
        <th>Status</th>
        <th>Onset Date</th>
        <th>Resolved Date</th>
      </tr>
      ${problems.map(problem => `
        <tr>
          <td>${problem.problem || 'N/A'}</td>
          <td>${problem.code || 'N/A'}</td>
          <td>${problem.status || 'N/A'}</td>
          <td>${formatDate(problem.onsetDate) || 'N/A'}</td>
          <td>${formatDate(problem.resolvedDate) || 'N/A'}</td>
        </tr>
      `).join('')}
    </table>
  </div>` : ''}
  
  ${procedures?.length > 0 ? `
  <div class="section">
    <h2>Procedures</h2>
    <table>
      <tr>
        <th>Procedure</th>
        <th>Code</th>
        <th>Date</th>
        <th>Status</th>
        <th>Performer</th>
      </tr>
      ${procedures.map(proc => `
        <tr>
          <td>${proc.name || 'N/A'}</td>
          <td>${proc.code || 'N/A'}</td>
          <td>${formatDate(proc.date) || 'N/A'}</td>
          <td>${proc.status || 'N/A'}</td>
          <td>${proc.performer || 'N/A'}</td>
        </tr>
      `).join('')}
    </table>
  </div>` : ''}
  
  ${encounters?.length > 0 ? `
  <div class="section">
    <h2>Encounters</h2>
    <table>
      <tr>
        <th>Type</th>
        <th>Date</th>
        <th>Provider</th>
        <th>Location</th>
        <th>Reason</th>
      </tr>
      ${encounters.map(enc => `
        <tr>
          <td>${enc.type || 'N/A'}</td>
          <td>${formatDate(enc.date) || 'N/A'}</td>
          <td>${enc.provider || 'N/A'}</td>
          <td>${enc.location || 'N/A'}</td>
          <td>${enc.reasonForVisit || 'N/A'}</td>
        </tr>
      `).join('')}
    </table>
  </div>` : ''}
  
  ${vitalSigns?.length > 0 ? `
  <div class="section">
    <h2>Vital Signs</h2>
    <table>
      <tr>
        <th>Date</th>
        <th>Blood Pressure</th>
        <th>Heart Rate</th>
        <th>Temperature</th>
        <th>Height</th>
        <th>Weight</th>
        <th>BMI</th>
      </tr>
      ${vitalSigns.map(vitals => `
        <tr>
          <td>${formatDate(vitals.date) || 'N/A'}</td>
          <td>${vitals.systolicBP && vitals.diastolicBP ? vitals.systolicBP.value + '/' + vitals.diastolicBP.value + ' ' + (vitals.systolicBP.unit || 'mmHg') : 'N/A'}</td>
          <td>${vitals.heartRate ? vitals.heartRate.value + ' ' + (vitals.heartRate.unit || 'bpm') : 'N/A'}</td>
          <td>${vitals.temperature ? vitals.temperature.value + ' ' + (vitals.temperature.unit || 'F') : 'N/A'}</td>
          <td>${vitals.height ? vitals.height.value + ' ' + (vitals.height.unit || 'cm') : 'N/A'}</td>
          <td>${vitals.weight ? vitals.weight.value + ' ' + (vitals.weight.unit || 'kg') : 'N/A'}</td>
          <td>${vitals.bmi ? vitals.bmi.value + ' ' + (vitals.bmi.unit || '') : 'N/A'}</td>
        </tr>
      `).join('')}
    </table>
  </div>` : ''}
  
  ${labResults?.length > 0 ? `
  <div class="section">
    <h2>Laboratory Results</h2>
    ${labResults.map(lab => 
      '<h3>' + (lab.panel || 'Lab Panel') + ' - ' + (formatDate(lab.date) || 'Unknown Date') + '</h3>' +
      '<table>' +
      '<tr><th>Test</th><th>Value</th><th>Unit</th><th>Reference Range</th><th>Status</th></tr>' +
      (lab.results?.map(result => 
        '<tr>' +
        '<td>' + (result.test || 'N/A') + '</td>' +
        '<td>' + (result.value || 'N/A') + '</td>' +
        '<td>' + (result.unit || 'N/A') + '</td>' +
        '<td>' + (result.referenceRange || 'N/A') + '</td>' +
        '<td>' + (result.status || 'N/A') + '</td>' +
        '</tr>'
      ).join('') || '<tr><td colspan="5" class="no-data">No results available</td></tr>') +
      '</table>'
    ).join('')}
  </div>` : ''}
  
  <div class="section">
    <p style="text-align: center; color: #9ca3af; font-size: 9pt; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
      Generated by CCD Viewer on ${new Date().toLocaleDateString()}
    </p>
  </div>
</body>
</html>
  `;
}

function formatDate(dateString) {
  if (!dateString) return null;
  try {
    // Handle YYYYMMDDHHMMSS format
    if (typeof dateString === 'string' && dateString.length >= 8) {
      const year = dateString.substr(0, 4);
      const month = dateString.substr(4, 2);
      const day = dateString.substr(6, 2);
      return month + '/' + day + '/' + year;
    }
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return dateString;
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});