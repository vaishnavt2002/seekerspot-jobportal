from django.db import models
from auth_app.models import JobProvider, JobSeeker

# Create your models here.
class Skills(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50)
    class Meta:
        indexes = [
            models.Index(fields=['category']),
            ]
    def __str__(self):
        return self.name



class JobPost(models.Model):
    JOB_TYPE_CHOICES = (
        ('REMOTE', 'Remote'),
        ('HYBRID', 'Hybrid'),
        ('ONSITE', 'Onsite'),
    )
    EMPLOYMENT_TYPE_CHOICES = (
        ('FULL_TIME', 'Full-time'),
        ('PART_TIME', 'Part-time'),
        ('INTERNSHIP', 'Internship'),
        ('TRAINEE', 'Trainee'),
        ('CONTRACT', 'Contract'),
    )
    
    DOMAIN_CHOICES = (
        ('ACCOUNTING', 'Accounting'),
        ('IT', 'Information Technology'),
        ('MANAGEMENT', 'Management'),
        ('MARKETING', 'Marketing'),
        ('ENGINEERING', 'Engineering'),
        ('HEALTHCARE', 'Healthcare'),
        ('EDUCATION', 'Education'),
        ('OTHER', 'Other'),
    )
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('CLOSED', 'Closed'),
    )

    job_provider = models.ForeignKey(JobProvider, on_delete=models.CASCADE, related_name='job_posts')
    title = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField()
    responsibilities = models.TextField()
    location = models.CharField(max_length=255)
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES)
    skills = models.ManyToManyField(Skills, related_name='job_posts')
    domain = models.CharField(max_length=50, choices=DOMAIN_CHOICES)
    experience_level = models.IntegerField()  # Years of experience
    min_salary = models.IntegerField()
    max_salary = models.IntegerField()
    application_deadline = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    class Meta:
        indexes = [
            models.Index(fields=['location']),
            models.Index(fields=['job_type']),
            models.Index(fields=['employment_type']),
            models.Index(fields=['domain']),
            models.Index(fields=['experience_level']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_deleted']),
        ]

    def delete(self, *args, **kwargs):
        self.is_deleted = True
        self.save()

    def __str__(self):
        return f"{self.title} - {self.job_provider.company_name}"
    
    


class JobApplication(models.Model):
    STATUS_CHOICES = (
        ('APPLIED', 'Applied'),
        ('REVIEWING', 'Reviewing'),
        ('SHORTLISTED', 'Shortlisted'),
        ('REJECTED', 'Rejected'),
        ('HIRED', 'Hired'),
        ('WITHDRAWN', 'Withdrawn'),
    )

    jobpost = models.ForeignKey(JobPost, on_delete=models.CASCADE, related_name='applications')
    job_seeker = models.ForeignKey(JobSeeker, on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPLIED')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('jobpost', 'job_seeker')

    def __str__(self):
        return f"{self.job_seeker.user.username} -> {self.jobpost.title}"
    

class SavedJob(models.Model):
    job_seeker = models.ForeignKey(JobSeeker, on_delete=models.CASCADE, related_name='saved_jobs')
    jobpost = models.ForeignKey(JobPost, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('job_seeker', 'jobpost')

    def __str__(self):
        return f"{self.job_seeker.user.username} saved {self.jobpost.title}"

    
class JobQuestion(models.Model):
    QUESTION_TYPE_CHOICES = (
        ('YES_NO', 'Yes/No Question'),
        ('DESCRIPTIVE', 'Descriptive Question'),
    )
    
    job_post = models.ForeignKey(JobPost, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Question for {self.job_post.title}: {self.question_text[:50]}"

class JobQuestionAnswer(models.Model):
    question = models.ForeignKey(JobQuestion, on_delete=models.CASCADE, related_name='answers')
    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name='question_answers')
    answer_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('question', 'application')
        
    def __str__(self):
        return f"Answer to question {self.question.id} for application {self.application.id}"