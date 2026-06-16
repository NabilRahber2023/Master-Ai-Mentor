import json
import os
import sys

# Add current directory to sys.path
sys.path.append(os.getcwd())

try:
    from app.main import app
    
    # Generate OpenAPI schema
    openapi_schema = app.openapi()
    
    # Print keys of paths
    print(json.dumps(list(openapi_schema["paths"].keys()), indent=2))
    
except Exception as e:
    print(f"Error: {e}")
