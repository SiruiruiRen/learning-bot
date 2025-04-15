"""
Configuration management for the application.
This module provides a centralized configuration system that supports different environments.
"""

import os
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv
import pathlib

# Configure logging
logger = logging.getLogger("solbot.config")

# Default to local environment if not specified
DEFAULT_ENVIRONMENT = "local"

# Environment detection
ENVIRONMENT = os.getenv("APP_ENVIRONMENT", DEFAULT_ENVIRONMENT).lower()
logger.info(f"Detected environment: {ENVIRONMENT}")

# Load the appropriate .env file based on environment
def load_env_file():
    """Load the environment-specific .env file"""
    # Get the current directory (where this file is located)
    current_dir = pathlib.Path(__file__).parent.absolute()
    
    # Config directory is at ../config relative to this file
    config_dir = current_dir.parent / "config"
    
    # Try to load environment-specific .env file
    env_file = config_dir / f"{ENVIRONMENT}.env"
    
    if env_file.exists():
        logger.info(f"Loading environment configuration from {env_file}")
        load_dotenv(dotenv_path=str(env_file))
        return True
    else:
        logger.warning(f"Environment file {env_file} not found")
        
        # Fall back to regular .env files
        logger.info("Falling back to default .env files")
        load_dotenv()
        return False

# Load environment variables before continuing
load_env_file()

# Core configurations that apply to all environments
CORE_CONFIG = {
    # Server settings
    "PORT": 8081,
    "HOST": "0.0.0.0",
    
    # Model settings
    "CLAUDE_MODEL": "claude-3-5-sonnet-20241022",
    
    # Keep alive settings
    "ENABLE_WARMUP": True,
}

# Environment-specific configurations
ENV_CONFIGS = {
    "local": {
        "DEBUG": True,
        "USE_MEMORY_DB": False,
    },
    "vercel": {
        "DEBUG": False,
        "USE_MEMORY_DB": False,
        # Any Vercel-specific settings
    },
    "render": {
        "DEBUG": False,
        "USE_MEMORY_DB": False,
        # Any Render-specific settings
    },
    "production": {
        "DEBUG": False,
        "USE_MEMORY_DB": False,
    }
}

# Secret configurations that should be loaded from environment variables
SECRET_CONFIGS = [
    "ANTHROPIC_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "SUPABASE_SERVICE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
]

class Config:
    """Central configuration manager for the application."""
    
    def __init__(self, environment: str = None):
        """Initialize the configuration for the specified environment."""
        self.environment = environment or ENVIRONMENT
        self.config: Dict[str, Any] = {}
        
        # Load configuration in the correct order
        self._load_core_config()
        self._load_environment_config()
        self._load_secrets()
        self._load_overrides()
        
        # Log configuration (excluding secrets)
        self._log_config()
    
    def _load_core_config(self):
        """Load core configuration that applies to all environments."""
        self.config.update(CORE_CONFIG)
    
    def _load_environment_config(self):
        """Load environment-specific configuration."""
        if self.environment in ENV_CONFIGS:
            self.config.update(ENV_CONFIGS[self.environment])
        else:
            logger.warning(f"Unknown environment: {self.environment}, using local config")
            self.config.update(ENV_CONFIGS["local"])
    
    def _load_secrets(self):
        """Load secrets from environment variables."""
        for key in SECRET_CONFIGS:
            value = os.getenv(key)
            if value:
                self.config[key] = value
            else:
                logger.warning(f"Secret {key} not found in environment variables")
    
    def _load_overrides(self):
        """Load any direct environment variable overrides."""
        # Any environment variable that matches a config key will override it
        for key in self.config.keys():
            env_value = os.getenv(key)
            if env_value is not None:
                # Convert boolean strings to actual booleans
                if env_value.lower() in ("true", "false"):
                    self.config[key] = env_value.lower() == "true"
                # Convert numeric strings to integers or floats
                elif env_value.isdigit():
                    self.config[key] = int(env_value)
                elif env_value.replace(".", "", 1).isdigit() and env_value.count(".") == 1:
                    self.config[key] = float(env_value)
                else:
                    self.config[key] = env_value
    
    def _log_config(self):
        """Log the loaded configuration (excluding secrets)."""
        safe_config = {k: v for k, v in self.config.items() if k not in SECRET_CONFIGS}
        logger.info(f"Loaded configuration for environment '{self.environment}': {safe_config}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value by key."""
        return self.config.get(key, default)
    
    def __getitem__(self, key: str) -> Any:
        """Get a configuration value by key using dict-like access."""
        return self.config[key]
    
    def __contains__(self, key: str) -> bool:
        """Check if a configuration key exists."""
        return key in self.config

# Create a global instance of the configuration
config = Config()

def get_config() -> Config:
    """Get the global configuration instance."""
    return config 