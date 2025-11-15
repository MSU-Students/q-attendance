// Cloud Function configuration
export const CLOUD_FUNCTIONS_URL = import.meta.env.VITE_CLOUD_FUNCTIONS_URL || 'http://localhost:5001/msu-attendance/us-central1/api';

export const API_ENDPOINTS = {
  uploadUsers: `${CLOUD_FUNCTIONS_URL}/uploadUsers`,
};
