# Configuration System

This directory contains environment-specific configuration files for the application. Instead of maintaining separate branches for different deployment targets, we use a configuration-based approach.

## Environment Files

- `local.env` - Configuration for local development
- `vercel.env` - Configuration for Vercel deployment
- `render.env` - Configuration for Render deployment

## How it Works

1. The application detects the environment based on the `APP_ENVIRONMENT` environment variable
2. It loads the appropriate `.env` file from this directory
3. Settings from the environment file are combined with core settings and any overrides

## Setting the Environment

To specify which environment to use:

### Local Development

```bash
# In your terminal
export APP_ENVIRONMENT=local
python backend/main.py
```

### Vercel Deployment

Add this to your Vercel environment variables:
```
APP_ENVIRONMENT=vercel
```

### Render Deployment

Add this to your Render environment variables:
```
APP_ENVIRONMENT=render
```

## Adding a New Configuration

To add configuration for a new environment:

1. Create a new file in this directory named `[environment].env`
2. Include all necessary configuration values
3. Set `APP_ENVIRONMENT=[environment]` when running the application

## Secrets

Sensitive information (API keys, database credentials) should be set as environment variables in your deployment platform and not committed to version control.

## Default Values

If an environment file is not found, the application will fall back to standard `.env` files or default values. 