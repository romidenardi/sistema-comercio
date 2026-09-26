import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['.csv', '.xlsx', '.xls'];
  const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no soportado. Usá .csv, .xlsx o .xls'));
  }
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });