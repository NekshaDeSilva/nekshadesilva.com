#!/usr/bin/env python3
"""
Auto-discovery script for articles (Python version)
Scans the docs/ folder and returns all articles with valid metadata.json
"""

import os
import json
from datetime import datetime
from pathlib import Path

def discover_articles():
    """Scan docs folder and return article metadata"""
    base_folder = Path(__file__).parent / 'docs'
    articles = []
    
    if not base_folder.exists():
        return {
            'error': 'Docs folder not found',
            'articles': []
        }
    
    # Scan all subdirectories in docs/
    for folder in base_folder.iterdir():
        if not folder.is_dir():
            continue
            
        metadata_path = folder / 'metadata.json'
        
        if metadata_path.exists():
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                
                if 'title' in metadata:
                    metadata['folder'] = folder.name
                    metadata['url'] = f'./docs/{folder.name}/'
                    articles.append(metadata)
                    
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading {metadata_path}: {e}")
                continue
    
    # Sort by date (newest first)
    articles.sort(key=lambda x: datetime.fromisoformat(x.get('date', '1970-01-01')), reverse=True)
    
    return {
        'success': True,
        'baseFolder': 'docs',
        'articles': articles,
        'count': len(articles)
    }

if __name__ == '__main__':
    # For CGI or command-line usage
    print('Content-Type: application/json')
    print()
    print(json.dumps(discover_articles(), indent=2))
