from django.contrib import admin

from jobpost_app.models import JobPost, Skills, JobApplication

# Register your models here.
admin.site.register([Skills,JobPost,JobApplication])