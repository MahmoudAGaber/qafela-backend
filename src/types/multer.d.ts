declare module 'multer' {
  interface StorageEngine {}
  interface MulterOptions { storage?: StorageEngine; [key: string]: any }
  interface MulterInstance {
    single(field: string): any;
  }
  function multer(opts?: MulterOptions): MulterInstance;
  namespace multer {
    function diskStorage(opts: any): StorageEngine;
  }
  export = multer;
}
