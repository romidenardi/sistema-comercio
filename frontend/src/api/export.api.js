import api from './axios.js';

export const getExportStatus = () => api.get('/export/status');
export const downloadBusinessExport = () => api.get('/export', { responseType: 'blob' });
