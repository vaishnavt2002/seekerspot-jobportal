from django.contrib import admin

from jobpost_app.models import JobPost, Skills

# Register your models here.
admin.site.register([Skills,JobPost])