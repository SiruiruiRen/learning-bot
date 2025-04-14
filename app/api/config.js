// This file is used to configure API route options
export const config = {
  // Set maximum duration to 60 seconds
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
  runtime: 'edge', // Use Edge runtime for longer functions
}; 