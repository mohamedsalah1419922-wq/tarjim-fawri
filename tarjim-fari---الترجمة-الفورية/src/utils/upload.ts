export interface FetchWithProgressOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData | Blob | File;
  onUploadProgress?: (progressEvent: ProgressEvent, percentage: number) => void;
  onDownloadProgress?: (progressEvent: ProgressEvent, percentage: number) => void;
}

export function fetchWithProgress(url: string, options: FetchWithProgressOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open(options.method || 'GET', url);
    
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }

    if (options.onUploadProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded * 100) / e.total);
          options.onUploadProgress!(e, percentage);
        }
      });
    }

    if (options.onDownloadProgress) {
      xhr.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded * 100) / e.total);
          options.onDownloadProgress!(e, percentage);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          resolve(xhr.responseText);
        }
      } else {
        try {
          const errorResp = JSON.parse(xhr.responseText);
          reject(new Error(errorResp.message || `Request failed with status ${xhr.status}`));
        } catch (e) {
          reject(new Error(`Request failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network Error"));
    };

    xhr.send(options.body as any);
  });
}
