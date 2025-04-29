def get_attachment_type(attachment):
    """
    Determine the file type of an attachment based on its extension.
    Returns None if no attachment, or a string like 'pdf', 'image', 'document', or 'unknown'.
    """
    if not attachment:
        return None
    filename = attachment.name.lower()
    if filename.endswith('.pdf'):
        return 'pdf'
    elif filename.endswith(('.jpg', '.jpeg', '.png', '.gif')):
        return 'image'
    elif filename.endswith(('.doc', '.docx')):
        return 'document'
    return 'unknown'