#!/usr/bin/env python3
"""
HRM Service Demo Data Seeding Script
Creates comprehensive dummy data for all HRM modules
"""

import asyncio
import sys
import os
from datetime import datetime, date, timedelta
from bson import ObjectId
import random

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import get_database
from app.models.employee import EmployeeStatus, EmploymentType, Gender
from app.models.payroll import PayrollStatus
from app.models.attendance import AttendanceStatus
from app.models.leave import LeaveType, LeaveStatus
from app.models.performance import ReviewStatus
from app.models.recruitment import ApplicationStatus
from app.models.training import TrainingStatus
from app.models.benefits import BenefitStatus

# Sample data
DEPARTMENTS = [
    "Engineering", "Marketing", "Sales", "Human Resources", "Finance", 
    "Operations", "Customer Support", "Product Management", "Design"
]

POSITIONS = [
    "Software Engineer", "Senior Software Engineer", "Lead Engineer", "Engineering Manager",
    "Marketing Manager", "Marketing Specialist", "Content Creator",
    "Sales Representative", "Sales Manager", "Account Executive",
    "HR Manager", "HR Specialist", "Recruiter",
    "Financial Analyst", "Accountant", "Finance Manager",
    "Operations Manager", "Operations Coordinator",
    "Customer Success Manager", "Support Specialist",
    "Product Manager", "Product Owner",
    "UX Designer", "UI Designer", "Design Manager"
]

FIRST_NAMES = [
    "John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Jessica",
    "William", "Ashley", "James", "Amanda", "Christopher", "Jennifer", "Daniel",
    "Lisa", "Matthew", "Michelle", "Anthony", "Kimberly", "Mark", "Donna",
    "Donald", "Carol", "Steven", "Sandra", "Paul", "Ruth", "Andrew", "Sharon"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"
]

COMPANIES = [
    "TechCorp", "InnovateLabs", "DataFlow", "CloudSoft", "NextGen",
    "FutureTech", "SmartSolutions", "DigitalWorks", "CodeCraft", "AppVenture"
]

TRAINING_PROGRAMS = [
    "Leadership Development", "Technical Skills", "Communication Skills",
    "Project Management", "Agile Methodology", "Customer Service Excellence",
    "Financial Analysis", "Sales Techniques", "HR Best Practices",
    "Data Analysis", "Cybersecurity Awareness", "Diversity & Inclusion"
]

BENEFIT_PLANS = [
    "Health Insurance", "Dental Insurance", "Vision Insurance", "Life Insurance",
    "Retirement Plan", "Disability Insurance", "Wellness Program", "Gym Membership",
    "Professional Development", "Tuition Reimbursement", "Flexible Spending Account"
]

JOB_TITLES = [
    "Software Engineer", "Marketing Manager", "Sales Representative", "HR Specialist",
    "Financial Analyst", "Operations Coordinator", "Customer Success Manager",
    "Product Manager", "UX Designer", "Data Scientist", "DevOps Engineer",
    "Business Analyst", "Project Manager", "Quality Assurance Engineer"
]

class HRMDataSeeder:
    def __init__(self):
        self.db = None
        
    async def connect(self):
        """Connect to the database"""
        from app.database.connection import connect_to_mongo
        await connect_to_mongo()
        self.db = get_database()
        print("✅ Connected to HRM database")
        
    async def seed_employees(self):
        """Create sample employees"""
        print("👥 Creating sample employees...")
        
        employees = []
        for i in range(50):  # Create 50 employees
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            department = random.choice(DEPARTMENTS)
            position = random.choice(POSITIONS)
            
            # Create employee data
            employee_data = {
                "employee_id": f"EMP{1000 + i:04d}",
                "first_name": first_name,
                "last_name": last_name,
                "full_name": f"{first_name} {last_name}",
                "email": f"{first_name.lower()}.{last_name.lower()}{i}@company.com",
                "phone": f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                "date_of_birth": (date.today() - timedelta(days=random.randint(6570, 14600))).isoformat(),  # 18-40 years old
                "gender": random.choice([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
                "department": department,
                "position": position,
                "start_date": (date.today() - timedelta(days=random.randint(30, 1000))).isoformat(),
                "salary": round(random.uniform(40000, 150000), 2),
                "status": random.choice([EmployeeStatus.ACTIVE, EmployeeStatus.ACTIVE, EmployeeStatus.ACTIVE, EmployeeStatus.ON_LEAVE]),
                "employment_type": random.choice([EmploymentType.FULL_TIME, EmploymentType.PART_TIME, EmploymentType.CONTRACT]),
                "manager_id": f"EMP{1000 + random.randint(0, i-1):04d}" if i > 0 else None,
                "address": {
                    "street": f"{random.randint(100, 9999)} Main St",
                    "city": random.choice(["New York", "San Francisco", "Chicago", "Boston", "Seattle"]),
                    "state": random.choice(["NY", "CA", "IL", "MA", "WA"]),
                    "postal_code": f"{random.randint(10000, 99999)}",
                    "country": "USA"
                },
                "emergency_contact": {
                    "name": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                    "relationship": random.choice(["Spouse", "Parent", "Sibling", "Friend"]),
                    "phone": f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
                },
                "skills": [random.choice(["Python", "JavaScript", "Java", "C++", "SQL", "React", "Angular", "Vue.js"]) for _ in range(random.randint(1, 4))],
                "certifications": [random.choice(["AWS", "Azure", "Google Cloud", "PMP", "Scrum Master"]) for _ in range(random.randint(0, 3))],
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "created_by": "system",
                "updated_by": "system"
            }
            
            employees.append(employee_data)
        
        # Insert employees
        await self.db.employees.insert_many(employees)
        print(f"✅ Created {len(employees)} employees")
        
    async def seed_payroll(self):
        """Create sample payroll records"""
        print("💰 Creating sample payroll records...")
        
        # Get all employees
        employees = await self.db.employees.find().to_list(length=None)
        
        payroll_records = []
        for employee in employees:
            # Create payroll for last 3 months
            for month_offset in range(3):
                pay_date = date.today() - timedelta(days=30 * month_offset)
                pay_period_start = pay_date.replace(day=1)
                pay_period_end = (pay_period_start + timedelta(days=31)).replace(day=1) - timedelta(days=1)
                
                # Calculate payroll
                base_salary = employee["salary"]
                hours_worked = random.uniform(35, 45)
                overtime_hours = max(0, hours_worked - 40)
                
                gross_earnings = (base_salary / 12) + (overtime_hours * (base_salary / 12 / 40) * 1.5)
                
                # Deductions
                federal_tax = gross_earnings * 0.20
                state_tax = gross_earnings * 0.05
                social_security = gross_earnings * 0.062
                medicare = gross_earnings * 0.0145
                health_insurance = 200.0
                retirement = gross_earnings * 0.05
                
                total_deductions = federal_tax + state_tax + social_security + medicare + health_insurance + retirement
                net_pay = gross_earnings - total_deductions
                
                # Calculate additional required fields
                basic_salary = base_salary / 12
                overtime_rate = 1.5
                overtime_pay = round(overtime_hours * (base_salary / 12 / 40) * 1.5, 2)
                bonus = random.uniform(0, 1000) if random.choice([True, False]) else 0
                commission = random.uniform(0, 500) if random.choice([True, False]) else 0
                total_allowances = round(bonus + commission, 2)
                income_tax = round(federal_tax + state_tax, 2)
                
                payroll_data = {
                    "employee_id": employee["employee_id"],
                    "employee_name": f"{employee['first_name']} {employee['last_name']}",
                    "pay_period_start": datetime.combine(pay_period_start, datetime.min.time()),
                    "pay_period_end": datetime.combine(pay_period_end, datetime.min.time()),
                    "pay_date": datetime.combine(pay_date, datetime.min.time()),
                    
                    # Earnings - Required fields
                    "basic_salary": round(basic_salary, 2),
                    "overtime_hours": round(overtime_hours, 2),
                    "overtime_rate": overtime_rate,
                    "overtime_pay": overtime_pay,
                    "bonus": round(bonus, 2),
                    "commission": round(commission, 2),
                    "allowances": [],  # Empty list for now
                    "total_allowances": total_allowances,
                    "gross_earnings": round(gross_earnings, 2),
                    
                    # Deductions - Required fields
                    "tax_rate": 0.20,
                    "social_security_rate": 0.062,
                    "medicare_rate": 0.0145,
                    "income_tax": income_tax,
                    "social_security": round(social_security, 2),
                    "medicare": round(medicare, 2),
                    "deductions": [],  # Empty list for now
                    "total_deductions": round(total_deductions, 2),
                    "net_pay": round(net_pay, 2),
                    "status": random.choice([PayrollStatus.PROCESSED, PayrollStatus.PAID]),
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                
                payroll_records.append(payroll_data)
        
        # Insert payroll records
        await self.db.payrolls.insert_many(payroll_records)
        print(f"✅ Created {len(payroll_records)} payroll records")
        
    async def seed_attendance(self):
        """Create sample attendance records"""
        print("⏰ Creating sample attendance records...")
        
        employees = await self.db.employees.find().to_list(length=None)
        attendance_records = []
        
        for employee in employees:
            # Create attendance for last 30 days
            for day_offset in range(30):
                attendance_date = date.today() - timedelta(days=day_offset)
                
                # Skip weekends
                if attendance_date.weekday() >= 5:
                    continue
                
                # Random clock in/out times
                clock_in = datetime.combine(attendance_date, datetime.min.time().replace(hour=8, minute=random.randint(0, 30)))
                clock_out = datetime.combine(attendance_date, datetime.min.time().replace(hour=17, minute=random.randint(0, 30)))
                
                hours_worked = (clock_out - clock_in).total_seconds() / 3600
                
                attendance_data = {
                    "employee_id": employee["employee_id"],
                    "employee_name": f"{employee['first_name']} {employee['last_name']}",
                    "date": datetime.combine(attendance_date, datetime.min.time()),
                    "clock_in_time": clock_in,
                    "clock_out_time": clock_out,
                    "total_hours": round(hours_worked, 2),
                    "overtime_hours": max(0, round(hours_worked - 8, 2)),
                    "status": random.choice([AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.LATE]),
                    "notes": "Regular work day" if hours_worked >= 7 else "Short day",
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                
                attendance_records.append(attendance_data)
        
        # Insert attendance records
        await self.db.attendance.insert_many(attendance_records)
        print(f"✅ Created {len(attendance_records)} attendance records")
        
    async def seed_leaves(self):
        """Create sample leave requests"""
        print("🏖️ Creating sample leave requests...")
        
        employees = await self.db.employees.find().to_list(length=None)
        leave_records = []
        
        for employee in employees:
            # Create 1-3 leave requests per employee
            num_leaves = random.randint(1, 3)
            
            for _ in range(num_leaves):
                leave_type = random.choice([LeaveType.VACATION, LeaveType.SICK_LEAVE, LeaveType.PERSONAL_LEAVE])
                start_date = date.today() - timedelta(days=random.randint(1, 365))
                duration = random.randint(1, 10)
                end_date = start_date + timedelta(days=duration)
                
                leave_data = {
                    "employee_id": employee["employee_id"],
                    "employee_name": f"{employee['first_name']} {employee['last_name']}",
                    "leave_type": leave_type,
                    "start_date": datetime.combine(start_date, datetime.min.time()),
                    "end_date": datetime.combine(end_date, datetime.min.time()),
                    "total_days": duration,
                    "reason": f"{leave_type.value} request",
                    "status": random.choice([LeaveStatus.APPROVED, LeaveStatus.PENDING, LeaveStatus.REJECTED]),
                    "requested_at": datetime.combine(start_date - timedelta(days=random.randint(1, 30)), datetime.min.time()),
                    "approved_by": f"EMP{1000 + random.randint(0, 10):04d}",
                    "notes": f"Approved for {duration} days",
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                    "created_by": "system",
                    "updated_by": "system"
                }
                
                leave_records.append(leave_data)
        
        # Insert leave records
        await self.db.leaves.insert_many(leave_records)
        print(f"✅ Created {len(leave_records)} leave records")
        
    async def seed_performance_reviews(self):
        """Create sample performance reviews"""
        print("📊 Creating sample performance reviews...")
        
        employees = await self.db.employees.find().to_list(length=None)
        review_records = []
        
        for employee in employees:
            # Create performance review
            review_date = date.today() - timedelta(days=random.randint(30, 365))
            
            # Generate proper rating scale values
            rating_scale_values = ["excellent", "above_expectations", "meets_expectations", "below_expectations", "unsatisfactory"]
            overall_rating = random.choice(rating_scale_values)
            
            # Calculate overall score from rating
            rating_scores = {
                "excellent": 5.0,
                "above_expectations": 4.0,
                "meets_expectations": 3.0,
                "below_expectations": 2.0,
                "unsatisfactory": 1.0
            }
            overall_score = rating_scores[overall_rating]
            
            review_data = {
                "employee_id": employee["employee_id"],
                "employee_name": f"{employee['first_name']} {employee['last_name']}",
                "reviewer_id": f"EMP{1000 + random.randint(0, 10):04d}",
                "reviewer_name": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                "review_period_start": datetime.combine(review_date - timedelta(days=365), datetime.min.time()),
                "review_period_end": datetime.combine(review_date, datetime.min.time()),
                "review_type": "annual",
                "categories": [
                    {
                        "name": "Goals Achievement",
                        "description": "How well the employee achieved their goals",
                        "weight": 0.3,
                        "rating": random.choice(rating_scale_values),
                        "comments": "Good progress on assigned goals"
                    },
                    {
                        "name": "Technical Skills",
                        "description": "Technical competency and skill development",
                        "weight": 0.25,
                        "rating": random.choice(rating_scale_values),
                        "comments": "Strong technical foundation"
                    },
                    {
                        "name": "Communication",
                        "description": "Communication skills and collaboration",
                        "weight": 0.2,
                        "rating": random.choice(rating_scale_values),
                        "comments": "Effective communication with team"
                    },
                    {
                        "name": "Leadership",
                        "description": "Leadership qualities and initiative",
                        "weight": 0.15,
                        "rating": random.choice(rating_scale_values),
                        "comments": "Shows leadership potential"
                    },
                    {
                        "name": "Attitude",
                        "description": "Work attitude and professionalism",
                        "weight": 0.1,
                        "rating": random.choice(rating_scale_values),
                        "comments": "Positive attitude and professionalism"
                    }
                ],
                "goals": [
                    {
                        "title": "Complete project deliverables",
                        "description": "Finish assigned project tasks on time",
                        "target_date": datetime.combine(review_date + timedelta(days=90), datetime.min.time()),
                        "status": random.choice(["completed", "in_progress", "not_started"]),
                        "progress_percentage": random.randint(0, 100),
                        "comments": "Making good progress"
                    },
                    {
                        "title": "Improve technical skills",
                        "description": "Learn new technologies and improve existing skills",
                        "target_date": datetime.combine(review_date + timedelta(days=180), datetime.min.time()),
                        "status": random.choice(["completed", "in_progress", "not_started"]),
                        "progress_percentage": random.randint(0, 100),
                        "comments": "Consistent learning approach"
                    }
                ],
                "employee_comments": f"Good performance overall. {random.choice(['Keep up the great work!', 'Room for improvement.', 'Excellent contribution to the team.'])}",
                "manager_comments": f"Employee shows {random.choice(['excellent', 'good', 'satisfactory'])} performance in their role.",
                "hr_comments": "Performance review completed successfully.",
                "overall_rating": overall_rating,
                "overall_score": overall_score,
                "development_plan": f"Focus on {random.choice(['technical skills', 'leadership', 'communication', 'project management'])} development.",
                "next_review_date": datetime.combine(review_date + timedelta(days=365), datetime.min.time()),
                "status": random.choice([ReviewStatus.COMPLETED, ReviewStatus.IN_PROGRESS]),
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "created_by": "system",
                "updated_by": "system"
            }
            
            review_records.append(review_data)
        
        # Insert review records
        await self.db.performance_reviews.insert_many(review_records)
        print(f"✅ Created {len(review_records)} performance reviews")
        
    async def seed_job_postings(self):
        """Create sample job postings and applicants"""
        print("💼 Creating sample job postings and applicants...")
        
        # Create job postings
        job_postings = []
        for _i in range(10):
            posting_data = {
                "job_id": f"JOB-{datetime.now().strftime('%Y%m%d')}-{str(ObjectId())[:6].upper()}",
                "title": random.choice(JOB_TITLES),
                "department": random.choice(DEPARTMENTS),
                "location": random.choice(["New York, NY", "San Francisco, CA", "Chicago, IL", "Remote"]),
                "employment_type": random.choice(["full_time", "part_time", "contract"]),
                "experience_level": random.choice(["entry", "mid", "senior", "executive"]),
                "salary_range_min": random.randint(50000, 150000),
                "salary_range_max": random.randint(150000, 250000),
                "currency": "USD",
                "description": f"Join our {random.choice(DEPARTMENTS)} team as a {random.choice(JOB_TITLES)}. We're looking for a talented professional to help drive our mission forward.",
                "requirements": [
                    "Bachelor's degree in relevant field",
                    f"{random.randint(2, 8)} years of experience",
                    "Strong communication skills",
                    "Team player attitude"
                ],
                "responsibilities": [
                    "Lead project initiatives",
                    "Collaborate with cross-functional teams",
                    "Deliver high-quality results",
                    "Mentor junior team members"
                ],
                "benefits": [
                    "Health insurance",
                    "Dental insurance",
                    "401(k) matching",
                    "Flexible work arrangements"
                ],
                "skills_required": ["Python", "JavaScript", "SQL", "Communication"],
                "qualifications": ["Bachelor's degree", "Relevant experience"],
                "application_deadline": datetime.combine(date.today() + timedelta(days=random.randint(7, 30)), datetime.max.time()),
                "start_date": datetime.combine(date.today() + timedelta(days=random.randint(30, 60)), datetime.min.time()),
                "hiring_manager_id": f"EMP{1000 + random.randint(0, 10):04d}",
                "hiring_manager_name": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                "recruiter_id": f"EMP{1000 + random.randint(0, 10):04d}",
                "recruiter_name": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                "is_remote": random.choice([True, False]),
                "is_urgent": random.choice([True, False]),
                "status": random.choice(["draft", "published", "closed"]),
                "total_applications": 0,
                "notes": "Great opportunity for growth",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "published_at": datetime.now() if random.choice([True, False]) else None,
                "closed_at": None,
                "created_by": "system",
                "updated_by": "system"
            }
            job_postings.append(posting_data)
        
        # Insert job postings
        await self.db.job_postings.insert_many(job_postings)
        
        # Create applications
        applications = []
        for posting in job_postings:
            num_applications = random.randint(3, 15)
            for _ in range(num_applications):
                first_name = random.choice(FIRST_NAMES)
                last_name = random.choice(LAST_NAMES)
                
                application_data = {
                    "job_posting_id": str(posting["_id"]),
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": f"{first_name.lower()}.{last_name.lower()}@email.com",
                    "phone": f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                    "resume_url": f"https://example.com/resumes/{first_name.lower()}_{last_name.lower()}.pdf",
                    "cover_letter": f"Dear Hiring Manager, I am excited to apply for the {posting['title']} position...",
                    "experience_years": random.randint(0, 10),
                    "education": random.choice(["High School", "Bachelor's", "Master's", "PhD"]),
                    "status": random.choice([ApplicationStatus.APPLIED, ApplicationStatus.SCREENING, ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.REJECTED, ApplicationStatus.ACCEPTED]),
                    "applied_date": datetime.combine(date.today() - timedelta(days=random.randint(1, 30)), datetime.min.time()),
                    "notes": f"Strong candidate with {random.randint(2, 8)} years experience",
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                applications.append(application_data)
        
        # Insert applications
        await self.db.applications.insert_many(applications)
        print(f"✅ Created {len(job_postings)} job postings and {len(applications)} applications")
        
    async def seed_training_programs(self):
        """Create sample training programs and enrollments"""
        print("🎓 Creating sample training programs and enrollments...")
        
        # Create training programs
        training_programs = []
        for program_name in TRAINING_PROGRAMS:
            program_data = {
                "name": program_name,
                "description": f"Comprehensive {program_name.lower()} training program",
                "category": random.choice(["Technical", "Soft Skills", "Leadership", "Compliance"]),
                "duration_hours": random.randint(8, 40),
                "instructor": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                "max_participants": random.randint(10, 50),
                "start_date": datetime.combine(date.today() + timedelta(days=random.randint(1, 90)), datetime.min.time()),
                "end_date": datetime.combine(date.today() + timedelta(days=random.randint(91, 180)), datetime.max.time()),
                "location": random.choice(["Conference Room A", "Training Center", "Online", "Main Office"]),
                "cost": round(random.uniform(500, 5000), 2),
                "status": random.choice(["Scheduled", "In Progress", "Completed", "Cancelled"]),
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            training_programs.append(program_data)
        
        # Insert training programs
        await self.db.training_programs.insert_many(training_programs)
        
        # Create employee training enrollments
        employees = await self.db.employees.find().to_list(length=None)
        enrollments = []
        
        for employee in employees:
            # Enroll in 1-3 training programs
            num_enrollments = random.randint(1, 3)
            selected_programs = random.sample(training_programs, min(num_enrollments, len(training_programs)))
            
            for program in selected_programs:
                enrollment_data = {
                    "employee_id": employee["employee_id"],
                    "employee_name": f"{employee['first_name']} {employee['last_name']}",
                    "training_program_id": str(program["_id"]),
                    "training_name": program["name"],
                    "enrollment_date": datetime.combine(date.today() - timedelta(days=random.randint(1, 30)), datetime.min.time()),
                    "completion_date": datetime.combine(date.today() + timedelta(days=random.randint(1, 60)), datetime.max.time()) if random.choice([True, False]) else None,
                    "status": random.choice([TrainingStatus.PUBLISHED, TrainingStatus.IN_PROGRESS, TrainingStatus.COMPLETED, TrainingStatus.CANCELLED]),
                    "score": round(random.uniform(60, 100), 1) if random.choice([True, False]) else None,
                    "certificate_url": f"https://example.com/certificates/{employee['employee_id']}_{program['name'].replace(' ', '_')}.pdf" if random.choice([True, False]) else None,
                    "notes": f"Enrolled in {program['name']}",
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                enrollments.append(enrollment_data)
        
        # Insert enrollments
        await self.db.employee_training.insert_many(enrollments)
        print(f"✅ Created {len(training_programs)} training programs and {len(enrollments)} enrollments")
        
    async def seed_benefits(self):
        """Create sample benefit plans and enrollments"""
        print("🏥 Creating sample benefit plans and enrollments...")
        
        # Create benefit plans
        benefit_plans = []
        for plan_name in BENEFIT_PLANS:
            plan_data = {
                "name": plan_name,
                "description": f"Comprehensive {plan_name.lower()} coverage",
                "category": random.choice(["Health", "Financial", "Professional", "Wellness"]),
                "cost_employee": round(random.uniform(50, 500), 2),
                "cost_company": round(random.uniform(100, 1000), 2),
                "coverage_percentage": random.randint(70, 100),
                "eligibility_requirements": [
                    "Full-time employee",
                    "30+ days employment",
                    "Active status"
                ],
                "enrollment_period": {
                    "start": datetime.combine(date.today() - timedelta(days=30), datetime.min.time()),
                    "end": datetime.combine(date.today() + timedelta(days=30), datetime.max.time())
                },
                "status": random.choice(["Active", "Inactive", "Suspended"]),
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            benefit_plans.append(plan_data)
        
        # Insert benefit plans
        await self.db.benefit_plans.insert_many(benefit_plans)
        
        # Create employee benefit enrollments
        employees = await self.db.employees.find().to_list(length=None)
        enrollments = []
        
        for employee in employees:
            # Enroll in 3-7 benefit plans
            num_enrollments = random.randint(3, 7)
            selected_plans = random.sample(benefit_plans, min(num_enrollments, len(benefit_plans)))
            
            for plan in selected_plans:
                enrollment_data = {
                    "employee_id": employee["employee_id"],
                    "employee_name": f"{employee['first_name']} {employee['last_name']}",
                    "benefit_plan_id": str(plan["_id"]),
                    "plan_name": plan["name"],
                    "enrollment_date": datetime.combine(date.today() - timedelta(days=random.randint(1, 365)), datetime.min.time()),
                    "coverage_start": datetime.combine(date.today() - timedelta(days=random.randint(1, 365)), datetime.min.time()),
                    "coverage_end": datetime.combine(date.today() + timedelta(days=random.randint(365, 730)), datetime.max.time()),
                    "employee_contribution": plan["cost_employee"],
                    "company_contribution": plan["cost_company"],
                    "status": random.choice([BenefitStatus.ACTIVE, BenefitStatus.ACTIVE, BenefitStatus.ACTIVE, BenefitStatus.CANCELLED]),
                    "notes": f"Enrolled in {plan['name']}",
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                enrollments.append(enrollment_data)
        
        # Insert enrollments
        await self.db.employee_benefits.insert_many(enrollments)
        print(f"✅ Created {len(benefit_plans)} benefit plans and {len(enrollments)} enrollments")
        
    async def seed_all(self):
        """Seed all HRM data"""
        print("🌱 Starting HRM demo data seeding...")
        
        await self.connect()
        
        # Clear existing data
        print("🧹 Clearing existing data...")
        await self.db.employees.delete_many({})
        await self.db.payrolls.delete_many({})
        await self.db.attendance.delete_many({})
        await self.db.leaves.delete_many({})
        await self.db.performance_reviews.delete_many({})
        await self.db.job_postings.delete_many({})
        await self.db.applications.delete_many({})
        await self.db.training_programs.delete_many({})
        await self.db.employee_training.delete_many({})
        await self.db.benefit_plans.delete_many({})
        await self.db.employee_benefits.delete_many({})
        
        # Seed data
        await self.seed_employees()
        await self.seed_payroll()
        await self.seed_attendance()
        await self.seed_leaves()
        await self.seed_performance_reviews()
        await self.seed_job_postings()
        await self.seed_training_programs()
        await self.seed_benefits()
        
        print("🎉 HRM demo data seeding completed successfully!")
        print("📊 Summary:")
        print(f"   - Employees: {await self.db.employees.count_documents({})}")
        print(f"   - Payroll Records: {await self.db.payrolls.count_documents({})}")
        print(f"   - Attendance Records: {await self.db.attendance.count_documents({})}")
        print(f"   - Leave Requests: {await self.db.leaves.count_documents({})}")
        print(f"   - Performance Reviews: {await self.db.performance_reviews.count_documents({})}")
        print(f"   - Job Postings: {await self.db.job_postings.count_documents({})}")
        print(f"   - Applications: {await self.db.applications.count_documents({})}")
        print(f"   - Training Programs: {await self.db.training_programs.count_documents({})}")
        print(f"   - Training Enrollments: {await self.db.employee_training.count_documents({})}")
        print(f"   - Benefit Plans: {await self.db.benefit_plans.count_documents({})}")
        print(f"   - Benefit Enrollments: {await self.db.employee_benefits.count_documents({})}")

async def main():
    """Main function to run the seeder"""
    seeder = HRMDataSeeder()
    await seeder.seed_all()

if __name__ == "__main__":
    asyncio.run(main())
