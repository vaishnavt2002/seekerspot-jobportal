# reports/views.py
import io
from django.http import HttpResponse
from django.db.models import Count, Avg, Min, Max, Q, F
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from datetime import datetime, timedelta

from auth_app.models import JobSeeker, JobProvider, User
from jobpost_app.models import JobPost, JobApplication, SavedJob, Skills
from interview_app.models import InterviewSchedule

class BaseReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_date_range(self, request):
        """Extract start_date and end_date from request params"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        try:
            if start_date:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            else:
                # Default to 30 days ago
                start_date = (timezone.now() - timedelta(days=30)).date()
                
            if end_date:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            else:
                end_date = timezone.now().date()
                
        except ValueError:
            start_date = (timezone.now() - timedelta(days=30)).date()
            end_date = timezone.now().date()
            
        return start_date, end_date
    
    def create_pdf(self, filename, elements):
        """Create PDF with provided elements"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=18)
        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
        return response

class JobSeekerReportView(BaseReportView):
    def get(self, request):
        report_type = request.query_params.get('type', 'pdf')
        start_date, end_date = self.get_date_range(request)
        
        # Filter job seekers by date range
        job_seekers = JobSeeker.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).select_related('user')
        
        # Generate statistics
        total_job_seekers = job_seekers.count()
        active_job_seekers = job_seekers.filter(user__is_active=True).count()
        verified_job_seekers = job_seekers.filter(user__is_verified=True).count()
        available_job_seekers = job_seekers.filter(is_available=True).count()
        
        # Experience distribution
        experience_distribution = {
            '0-1 years': job_seekers.filter(experience__lte=1).count(),
            '2-3 years': job_seekers.filter(experience__gte=2, experience__lte=3).count(),
            '4-5 years': job_seekers.filter(experience__gte=4, experience__lte=5).count(),
            '6-10 years': job_seekers.filter(experience__gte=6, experience__lte=10).count(),
            '10+ years': job_seekers.filter(experience__gt=10).count(),
        }
        
        # Salary expectations
        avg_current_salary = job_seekers.exclude(current_salary=None).aggregate(Avg('current_salary'))['current_salary__avg'] or 0
        avg_expected_salary = job_seekers.aggregate(Avg('expected_salary'))['expected_salary__avg'] or 0
        
        # Salary ranges
        salary_ranges = {
            'Under ₹5L': job_seekers.filter(expected_salary__lt=500000).count(),
            '₹5L-₹10L': job_seekers.filter(expected_salary__gte=500000, expected_salary__lt=1000000).count(),
            '₹10L-₹15L': job_seekers.filter(expected_salary__gte=1000000, expected_salary__lt=1500000).count(),
            '₹15L-₹20L': job_seekers.filter(expected_salary__gte=1500000, expected_salary__lt=2000000).count(),
            '₹20L+': job_seekers.filter(expected_salary__gte=2000000).count(),
        }
        
        # Weekly registration trend
        week_counts = []
        current_date = end_date
        for i in range(4):  # Last 4 weeks
            week_start = current_date - timedelta(days=current_date.weekday(), weeks=i)
            week_end = week_start + timedelta(days=6)
            if week_start < start_date:
                week_start = start_date
            count = job_seekers.filter(created_at__date__gte=week_start, created_at__date__lte=week_end).count()
            week_counts.insert(0, (f"{week_start.strftime('%d %b')} - {week_end.strftime('%d %b')}", count))
        
        if report_type == 'pdf':
            return self.generate_pdf(total_job_seekers, active_job_seekers, verified_job_seekers, 
                                    available_job_seekers, experience_distribution, avg_current_salary,
                                    avg_expected_salary, salary_ranges, week_counts, start_date, end_date)
        else:
            # Return JSON data for frontend rendering
            return Response({
                'total_job_seekers': total_job_seekers,
                'active_job_seekers': active_job_seekers,
                'verified_job_seekers': verified_job_seekers,
                'available_job_seekers': available_job_seekers,
                'experience_distribution': experience_distribution,
                'avg_current_salary': int(avg_current_salary),
                'avg_expected_salary': int(avg_expected_salary),
                'salary_ranges': salary_ranges,
                'weekly_registration': week_counts,
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d')
            })
    
    def generate_pdf(self, total, active, verified, available, experience_dist, 
                    avg_current, avg_expected, salary_ranges, week_counts, start_date, end_date):
        styles = getSampleStyleSheet()
        elements = []
        
        # Title
        title_style = styles['Heading1']
        title = Paragraph(f"Job Seeker Analytics Report", title_style)
        elements.append(title)
        
        # Date range
        date_style = styles['Italic']
        date_range = Paragraph(f"Period: {start_date.strftime('%d %b, %Y')} to {end_date.strftime('%d %b, %Y')}", date_style)
        elements.append(date_range)
        elements.append(Spacer(1, 20))
        
        # Summary statistics
        summary_style = styles['Normal']
        summary = Paragraph(f"<b>Total Job Seekers:</b> {total}", summary_style)
        elements.append(summary)
        elements.append(Paragraph(f"<b>Active Job Seekers:</b> {active} ({int(active/total*100) if total else 0}%)", summary_style))
        elements.append(Paragraph(f"<b>Verified Job Seekers:</b> {verified} ({int(verified/total*100) if total else 0}%)", summary_style))
        elements.append(Paragraph(f"<b>Available for Hire:</b> {available} ({int(available/total*100) if total else 0}%)", summary_style))
        elements.append(Spacer(1, 20))
        
        # Experience Distribution Table
        elements.append(Paragraph("<b>Experience Distribution</b>", styles['Heading3']))
        exp_data = [['Experience Range', 'Number of Job Seekers', 'Percentage']]
        for range_name, count in experience_dist.items():
            percentage = f"{int(count/total*100) if total else 0}%"
            exp_data.append([range_name, count, percentage])
            
        exp_table = Table(exp_data, colWidths=[150, 100, 100])
        exp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(exp_table)
        elements.append(Spacer(1, 20))
        
        # Salary Expectations
        elements.append(Paragraph("<b>Salary Information</b>", styles['Heading3']))
        elements.append(Paragraph(f"<b>Average Current Salary:</b> ₹{int(avg_current):,}", summary_style))
        elements.append(Paragraph(f"<b>Average Expected Salary:</b> ₹{int(avg_expected):,}", summary_style))
        elements.append(Spacer(1, 10))
        
        # Salary Ranges Table
        salary_data = [['Expected Salary Range', 'Number of Job Seekers', 'Percentage']]
        for range_name, count in salary_ranges.items():
            percentage = f"{int(count/total*100) if total else 0}%"
            salary_data.append([range_name, count, percentage])
            
        salary_table = Table(salary_data, colWidths=[150, 100, 100])
        salary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(salary_table)
        elements.append(Spacer(1, 20))
        
        # Weekly Registration Trend
        elements.append(Paragraph("<b>Weekly Registration Trend</b>", styles['Heading3']))
        weekly_data = [['Week', 'New Registrations']]
        for week, count in week_counts:
            weekly_data.append([week, count])
            
        weekly_table = Table(weekly_data, colWidths=[150, 100])
        weekly_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(weekly_table)
        
        # Create and return PDF
        return self.create_pdf("Job_Seeker_Analytics_Report", elements)

class JobPostReportView(BaseReportView):
    def get(self, request):
        report_type = request.query_params.get('type', 'pdf')
        start_date, end_date = self.get_date_range(request)
        
        # Filter job posts by date range
        job_posts = JobPost.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            is_deleted=False
        ).select_related('job_provider')
        
        # Generate statistics
        total_job_posts = job_posts.count()
        
        # Status distribution
        status_distribution = {
            'Published': job_posts.filter(status='PUBLISHED').count(),
            'Draft': job_posts.filter(status='DRAFT').count(),
            'Closed': job_posts.filter(status='CLOSED').count(),
        }
        
        # Job type distribution
        job_type_distribution = {
            'Remote': job_posts.filter(job_type='REMOTE').count(),
            'Hybrid': job_posts.filter(job_type='HYBRID').count(),
            'Onsite': job_posts.filter(job_type='ONSITE').count(),
        }
        
        # Employment type distribution
        employment_distribution = {
            'Full-time': job_posts.filter(employment_type='FULL_TIME').count(),
            'Part-time': job_posts.filter(employment_type='PART_TIME').count(),
            'Internship': job_posts.filter(employment_type='INTERNSHIP').count(),
            'Trainee': job_posts.filter(employment_type='TRAINEE').count(),
            'Contract': job_posts.filter(employment_type='CONTRACT').count(),
        }
        
        # Domain distribution
        domain_distribution = {}
        for choice in JobPost.DOMAIN_CHOICES:
            domain_code, domain_name = choice
            count = job_posts.filter(domain=domain_code).count()
            if count > 0:
                domain_distribution[domain_name] = count
        
        # Experience level distribution
        experience_distribution = {
            '0-1 years': job_posts.filter(experience_level__lte=1).count(),
            '2-3 years': job_posts.filter(experience_level__gte=2, experience_level__lte=3).count(),
            '4-5 years': job_posts.filter(experience_level__gte=4, experience_level__lte=5).count(),
            '6-10 years': job_posts.filter(experience_level__gte=6, experience_level__lte=10).count(),
            '10+ years': job_posts.filter(experience_level__gt=10).count(),
        }
        
        # Salary statistics
        salary_stats = job_posts.aggregate(
            avg_min_salary=Avg('min_salary'),
            avg_max_salary=Avg('max_salary'),
            min_salary=Min('min_salary'),
            max_salary=Max('max_salary')
        )
        
        # Top locations
        top_locations = job_posts.values('location').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        # Top skills
        top_skills = Skills.objects.filter(
            job_posts__in=job_posts
        ).annotate(
            count=Count('job_posts')
        ).order_by('-count')[:10]
        
        if report_type == 'pdf':
            return self.generate_pdf(total_job_posts, status_distribution, job_type_distribution,
                                    employment_distribution, domain_distribution, experience_distribution,
                                    salary_stats, top_locations, top_skills, start_date, end_date)
        else:
            # Return JSON data for frontend rendering
            return Response({
                'total_job_posts': total_job_posts,
                'status_distribution': status_distribution,
                'job_type_distribution': job_type_distribution,
                'employment_distribution': employment_distribution,
                'domain_distribution': domain_distribution,
                'experience_distribution': experience_distribution,
                'salary_stats': {
                    'avg_min_salary': int(salary_stats['avg_min_salary'] or 0),
                    'avg_max_salary': int(salary_stats['avg_max_salary'] or 0),
                    'min_salary': int(salary_stats['min_salary'] or 0),
                    'max_salary': int(salary_stats['max_salary'] or 0),
                },
                'top_locations': list(top_locations),
                'top_skills': [{'name': skill.name, 'count': skill.count} for skill in top_skills],
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d')
            })
    
    def generate_pdf(self, total, status_dist, job_type_dist, employment_dist, domain_dist,
                    exp_dist, salary_stats, top_locations, top_skills, start_date, end_date):
        styles = getSampleStyleSheet()
        elements = []
        
        # Title
        title_style = styles['Heading1']
        title = Paragraph(f"Job Posting Analytics Report", title_style)
        elements.append(title)
        
        # Date range
        date_style = styles['Italic']
        date_range = Paragraph(f"Period: {start_date.strftime('%d %b, %Y')} to {end_date.strftime('%d %b, %Y')}", date_style)
        elements.append(date_range)
        elements.append(Spacer(1, 20))
        
        # Summary statistics
        summary_style = styles['Normal']
        summary = Paragraph(f"<b>Total Job Posts:</b> {total}", summary_style)
        elements.append(summary)
        elements.append(Spacer(1, 20))
        
        # Status Distribution Table
        elements.append(Paragraph("<b>Job Post Status Distribution</b>", styles['Heading3']))
        status_data = [['Status', 'Count', 'Percentage']]
        for status, count in status_dist.items():
            percentage = f"{int(count/total*100) if total else 0}%"
            status_data.append([status, count, percentage])
            
        status_table = Table(status_data, colWidths=[150, 100, 100])
        status_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(status_table)
        elements.append(Spacer(1, 20))
        
        # Job Type Distribution Table
        elements.append(Paragraph("<b>Job Type Distribution</b>", styles['Heading3']))
        type_data = [['Job Type', 'Count', 'Percentage']]
        for job_type, count in job_type_dist.items():
            percentage = f"{int(count/total*100) if total else 0}%"
            type_data.append([job_type, count, percentage])
            
        type_table = Table(type_data, colWidths=[150, 100, 100])
        type_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(type_table)
        elements.append(Spacer(1, 20))
        
        # Employment Type Distribution
        elements.append(Paragraph("<b>Employment Type Distribution</b>", styles['Heading3']))
        emp_data = [['Employment Type', 'Count', 'Percentage']]
        for emp_type, count in employment_dist.items():
            percentage = f"{int(count/total*100) if total else 0}%"
            emp_data.append([emp_type, count, percentage])
            
        emp_table = Table(emp_data, colWidths=[150, 100, 100])
        emp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(emp_table)
        elements.append(Spacer(1, 20))
        
        # Domain Distribution
        elements.append(Paragraph("<b>Domain Distribution</b>", styles['Heading3']))
        domain_data = [['Domain', 'Count', 'Percentage']]
        for domain, count in domain_dist.items():
            percentage = f"{int(count/total*100) if total else 0}%"
            domain_data.append([domain, count, percentage])
            
        domain_table = Table(domain_data, colWidths=[150, 100, 100])
        domain_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(domain_table)
        elements.append(Spacer(1, 20))
        
        # Salary Information
        elements.append(Paragraph("<b>Salary Information</b>", styles['Heading3']))
        elements.append(Paragraph(f"<b>Average Minimum Salary:</b> ₹{int(salary_stats['avg_min_salary'] or 0):,}", summary_style))
        elements.append(Paragraph(f"<b>Average Maximum Salary:</b> ₹{int(salary_stats['avg_max_salary'] or 0):,}", summary_style))
        elements.append(Paragraph(f"<b>Lowest Salary Offered:</b> ₹{int(salary_stats['min_salary'] or 0):,}", summary_style))
        elements.append(Paragraph(f"<b>Highest Salary Offered:</b> ₹{int(salary_stats['max_salary'] or 0):,}", summary_style))
        elements.append(Spacer(1, 20))
        
        # Top Locations
        elements.append(Paragraph("<b>Top Job Locations</b>", styles['Heading3']))
        location_data = [['Location', 'Number of Job Posts']]
        for loc in top_locations:
            location_data.append([loc['location'], loc['count']])
            
        location_table = Table(location_data, colWidths=[150, 150])
        location_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(location_table)
        elements.append(Spacer(1, 20))
        
        # Top Skills
        elements.append(Paragraph("<b>Most In-Demand Skills</b>", styles['Heading3']))
        skills_data = [['Skill', 'Appearances in Job Posts']]
        for skill in top_skills:
            skills_data.append([skill.name, skill.count])
            
        skills_table = Table(skills_data, colWidths=[150, 150])
        skills_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(skills_table)
        
        # Create and return PDF
        return self.create_pdf("Job_Posting_Analytics_Report", elements)

class ApplicationsReportView(BaseReportView):
    def get(self, request):
        report_type = request.query_params.get('type', 'pdf')
        start_date, end_date = self.get_date_range(request)
        
        # Filter applications by date range
        applications = JobApplication.objects.filter(
            applied_at__date__gte=start_date,
            applied_at__date__lte=end_date
        ).select_related('jobpost', 'job_seeker__user')
        
        # Generate statistics
        total_applications = applications.count()
        
        # Status distribution
        status_distribution = {}
        for choice in JobApplication.STATUS_CHOICES:
            status_code, status_name = choice
            count = applications.filter(status=status_code).count()
            if count > 0:
                status_distribution[status_name] = count
        
        # Applications per job (top 10)
        applications_per_job = JobPost.objects.filter(
            applications__in=applications
        ).annotate(
            application_count=Count('applications')
        ).order_by('-application_count')[:10]
        
        # Applications by domain
        applications_by_domain = applications.values('jobpost__domain').annotate(
            count=Count('id')
        ).order_by('-count')
        domain_distribution = {}
        for domain_choice in JobPost.DOMAIN_CHOICES:
            domain_code, domain_name = domain_choice
            for domain in applications_by_domain:
                if domain['jobpost__domain'] == domain_code:
                    domain_distribution[domain_name] = domain['count']
        
        # Applications by experience level
        applications_by_experience = applications.values('job_seeker__experience').annotate(
            count=Count('id')
        ).order_by('job_seeker__experience')
        experience_distribution = {
            '0-1 years': sum(item['count'] for item in applications_by_experience if item['job_seeker__experience'] <= 1),
            '2-3 years': sum(item['count'] for item in applications_by_experience if 2 <= item['job_seeker__experience'] <= 3),
            '4-5 years': sum(item['count'] for item in applications_by_experience if 4 <= item['job_seeker__experience'] <= 5),
            '6-10 years': sum(item['count'] for item in applications_by_experience if 6 <= item['job_seeker__experience'] <= 10),
            '10+ years': sum(item['count'] for item in applications_by_experience if item['job_seeker__experience'] > 10)
        }
        
        # Applications trend (weekly)
        week_counts = []
        current_date = end_date
        for i in range(4):  # Last 4 weeks
            week_start = current_date - timedelta(days=current_date.weekday(), weeks=i)
            week_end = week_start + timedelta(days=6)
            if week_start < start_date:
                week_start = start_date
            count = applications.filter(applied_at__date__gte=week_start, applied_at__date__lte=week_end).count()
            week_counts.insert(0, (f"{week_start.strftime('%d %b')} - {week_end.strftime('%d %b')}", count))
        
        # Conversion rates (hired/total)
        conversion_rate = applications.filter(status='HIRED').count() / total_applications if total_applications else 0
        
        if report_type == 'pdf':
            return self.generate_pdf(total_applications, status_distribution, applications_per_job,
                                    domain_distribution, experience_distribution, week_counts,
                                    conversion_rate, start_date, end_date)
        else:
            # Return JSON data for frontend rendering
            return Response({
                'total_applications': total_applications,
                'status_distribution': status_distribution,
                'applications_per_job': [
                    {'job_title': job.title, 'company': job.job_provider.company_name, 'count': job.application_count}
                    for job in applications_per_job
                ],
                'domain_distribution': domain_distribution,
                'experience_distribution': experience_distribution,
                'weekly_trend': week_counts,
                'conversion_rate': conversion_rate,
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d')
            })
    
    def generate_pdf(self, total, status_dist, applications_per_job, domain_dist,
                    exp_dist, week_counts, conversion_rate, start_date, end_date):
        styles = getSampleStyleSheet()
        elements = []
        
        # Title
        title_style = styles['Heading1']
        title = Paragraph(f"Job Applications Report", title_style)
        elements.append(title)
        
        # Date range
        date_style = styles['Italic']
        date_range = Paragraph(f"Period: {start_date.strftime('%d %b, %Y')} to {end_date.strftime('%d %b, %Y')}", date_style)
        elements.append(date_range)
        elements.append(Spacer(1, 20))
        
        # Summary statistics
        summary_style = styles['Normal']
        summary = Paragraph(f"<b>Total Applications:</b> {total}", summary_style)
        elements.append(summary)
        elements.append(Paragraph(f"<b>Conversion Rate (Hired/Total):</b> {conversion_rate:.1%}", summary_style))
        elements.append(Spacer(1, 20))
        
        # Status Distribution Table
        elements.append(Paragraph("<b>Application Status Distribution</b>", styles['Heading3']))
        status_data = [['Status', 'Count', 'Percentage']]
        for status, count in status_dist.items():
            percentage = f"{int(count/total*100) if total else 0}%"
            status_data.append([status, count, percentage])
            
        status_table = Table(status_data, colWidths=[150, 100, 100])
        status_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(status_table)
        elements.append(Spacer(1, 20))
        
        # Top Jobs by Applications
        elements.append(Paragraph("<b>Most Popular Job Postings</b>", styles['Heading3']))
        job_data = [['Job Title', 'Company', 'Applications']]
        for job in applications_per_job:
            job_data.append([job.title, job.job_provider.company_name, job.application_count])
            
        job_table = Table(job_data, colWidths=[200, 150, 100])
        job_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(job_table)
        elements.append(Spacer(1, 20))
        
        # Domain Distribution
        elements.append(Paragraph("<b>Applications by Domain</b>", styles['Heading3']))
        domain_data = [['Domain', 'Number of Applications', 'Percentage']]
        for domain, count in domain_dist.items():
            percentage = f"{int(count/total*100) if total else 0}%"
            domain_data.append([domain, count, percentage])
            
        domain_table = Table(domain_data, colWidths=[200, 150, 100])
        domain_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(domain_table)
        elements.append(Spacer(1, 20))
        
        # Experience Distribution
        elements.append(Paragraph("<b>Applications by Experience Level</b>", styles['Heading3']))
        exp_data = [['Experience Range', 'Number of Applications', 'Percentage']]
        for exp_range, count in exp_dist.items():
            percentage = f"{int(count/total*100) if total else 0}%"
            exp_data.append([exp_range, count, percentage])
            
        exp_table = Table(exp_data, colWidths=[150, 150, 100])
        exp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(exp_table)
        elements.append(Spacer(1, 20))
        
        # Weekly Trend
        elements.append(Paragraph("<b>Weekly Application Trend</b>", styles['Heading3']))
        weekly_data = [['Week', 'Number of Applications']]
        for week, count in week_counts:
            weekly_data.append([week, count])
            
        weekly_table = Table(weekly_data, colWidths=[200, 150])
        weekly_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(weekly_table)
        
        # Create and return PDF
        return self.create_pdf("Job_Applications_Report", elements)

class InterviewsReportView(BaseReportView):
    def get(self, request):
        report_type = request.query_params.get('type', 'pdf')
        start_date, end_date = self.get_date_range(request)
        
        # Filter interviews by date range
        interviews = InterviewSchedule.objects.filter(
            interview_date__gte=start_date,
            interview_date__lte=end_date
        ).select_related('application__jobpost', 'application__job_seeker__user')
        
        # Generate statistics
        total_interviews = interviews.count()
        
        # Status distribution
        status_distribution = {}
        for choice in InterviewSchedule.STATUS_CHOICES:
            status_code, status_name = choice
            count = interviews.filter(status=status_code).count()
            if count > 0:
                status_distribution[status_name] = count
        
        # Interview type distribution
        type_distribution = {}
        for choice in InterviewSchedule.INTERVIEW_TYPE_CHOICES:
            type_code, type_name = choice
            count = interviews.filter(interview_type=type_code).count()
            if count > 0:
                type_distribution[type_name] = count
        
        # Interviews by domain
        interviews_by_domain = interviews.values('application__jobpost__domain').annotate(
            count=Count('id')
        ).order_by('-count')
        domain_distribution = {}
        for domain_choice in JobPost.DOMAIN_CHOICES:
            domain_code, domain_name = domain_choice
            for domain in interviews_by_domain:
                if domain['application__jobpost__domain'] == domain_code:
                    domain_distribution[domain_name] = domain['count']
        
        # Interviews by day of week
        day_distribution = {
            'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 
            'Thursday': 0, 'Friday': 0, 'Saturday': 0, 'Sunday': 0
        }
        for interview in interviews:
            day_name = interview.interview_date.strftime('%A')
            day_distribution[day_name] += 1
        
        # Completion rate
        completion_rate = interviews.filter(status='COMPLETED').count() / total_interviews if total_interviews else 0
        
        # Conversion rate (completed to hired)
        completed_interviews = interviews.filter(status='COMPLETED').values_list('application_id', flat=True)
        hired_after_interview = JobApplication.objects.filter(
            id__in=completed_interviews,
            status='HIRED'
        ).count()
        conversion_rate = hired_after_interview / len(completed_interviews) if completed_interviews else 0
        
        if report_type == 'pdf':
            return self.generate_pdf(total_interviews, status_distribution, type_distribution,
                                    domain_distribution, day_distribution, completion_rate,
                                    conversion_rate, start_date, end_date)
        else:
            # Return JSON data for frontend rendering
            return Response({
                'total_interviews': total_interviews,
                'status_distribution': status_distribution,
                'type_distribution': type_distribution,
                'domain_distribution': domain_distribution,
                'day_distribution': day_distribution,
                'completion_rate': completion_rate,
                'conversion_rate': conversion_rate,
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d')
            })
    
    def generate_pdf(self, total, status_dist, type_dist, domain_dist,
                    day_dist, completion_rate, conversion_rate, start_date, end_date):
        styles = getSampleStyleSheet()
        elements = []
        
        # Title
        title_style = styles['Heading1']
        title = Paragraph(f"Interviews Report", title_style)
        elements.append(title)
        
        # Date range
        date_style = styles['Italic']
        date_range = Paragraph(f"Period: {start_date.strftime('%d %b, %Y')} to {end_date.strftime('%d %b, %Y')}", date_style)
        elements.append(date_range)
        elements.append(Spacer(1, 20))
        
        # Summary statistics
        summary_style = styles['Normal']
        summary = Paragraph(f"<b>Total Interviews:</b> {total}", summary_style)
        elements.append(summary)
        elements.append(Paragraph(f"<b>Interview Completion Rate:</b> {completion_rate:.1%}", summary_style))
        elements.append(Paragraph(f"<b>Conversion Rate (Completed to Hired):</b> {conversion_rate:.1%}", summary_style))
        elements.append(Spacer(1, 20))
        
        # Status Distribution Table
        elements.append(Paragraph("<b>Interview Status Distribution</b>", styles['Heading3']))
        status_data = [['Status', 'Count', 'Percentage']]
        for status, count in status_dist.items():
            percentage = f"{int(count/total*100) if total else 0}%"
            status_data.append([status, count, percentage])
            
        status_table = Table(status_data, colWidths=[150, 100, 100])
        status_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(status_table)
        elements.append(Spacer(1, 20))
        
        # Interview Type Distribution
        elements.append(Paragraph("<b>Interview Type Distribution</b>", styles['Heading3']))
        type_data = [['Interview Type', 'Count', 'Percentage']]
        for int_type, count in type_dist.items():
            percentage = f"{int(count/total*100) if total else 0}%"
            type_data.append([int_type, count, percentage])
            
        type_table = Table(type_data, colWidths=[150, 100, 100])
        type_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(type_table)
        elements.append(Spacer(1, 20))
        
        # Domain Distribution
        elements.append(Paragraph("<b>Interviews by Domain</b>", styles['Heading3']))
        domain_data = [['Domain', 'Number of Interviews', 'Percentage']]
        for domain, count in domain_dist.items():
            percentage = f"{int(count/total*100) if total else 0}%"
            domain_data.append([domain, count, percentage])
            
        domain_table = Table(domain_data, colWidths=[200, 150, 100])
        domain_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(domain_table)
        elements.append(Spacer(1, 20))
        
        # Day of Week Distribution
        elements.append(Paragraph("<b>Interviews by Day of Week</b>", styles['Heading3']))
        day_data = [['Day', 'Number of Interviews', 'Percentage']]
        for day, count in day_dist.items():
            percentage = f"{int(count/total*100) if total else 0}%"
            day_data.append([day, count, percentage])
            
        day_table = Table(day_data, colWidths=[150, 150, 100])
        day_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(day_table)
        
        # Create and return PDF
        return self.create_pdf("Interview_Analytics_Report", elements)