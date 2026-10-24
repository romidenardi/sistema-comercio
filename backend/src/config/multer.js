import multer from 'multer';
import { httpError } from '../utils/httpError.js';

const storage = multer.memoryStorage();

// Primer filtro, por extensión. El contenido real se revisa en utils/parseSpreadsheet.js
const fileFilter = (req, file, cb) => {
  const allowed = ['.csv', '.xlsx', '.xls'];
  const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(httpError('Formato no soportado. Usá .csv, .xlsx o .xls'));
  }
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
