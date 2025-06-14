from django.core.files.storage import FileSystemStorage
from django.conf import settings
import os

class CommunityAttachmentStorage(FileSystemStorage):
    
    def __init__(self, *args, **kwargs):
        location = getattr(settings, 'MEDIA_ROOT', None)
        base_url = getattr(settings, 'MEDIA_URL', None)
        super().__init__(location=location, base_url=base_url, *args, **kwargs)
    
    def get_available_name(self, name, max_length=None):
        """
        Return a filename that's free on the target storage system.
        """
        name = self._normalize_name(name)
        return super().get_available_name(name, max_length)
    
    def _normalize_name(self, name):
        """
        Normalize filename by removing path information and special characters
        """
        import unicodedata
        import re
        
        name = os.path.basename(name)
        
        name = name.replace(' ', '_')
        
        name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii')
        name = re.sub(r'[^\w\s.-]', '', name)
        
        return name