# HRM Service

A comprehensive Human Resource Management microservice for the ERP system, providing complete employee lifecycle management, payroll processing, attendance tracking, leave management, performance reviews, recruitment, training, benefits administration, and HR analytics.

## Features

### 🧑‍💼 Employee Records
- Complete employee database with personal and professional information
- Employee hierarchy and reporting structure
- Skills and certifications tracking
- Employee status management (active, inactive, terminated, on leave)
- Comprehensive employee search and filtering

### 💰 Payroll Management
- Automated salary calculation with overtime, bonuses, and commissions
- Tax deductions (income tax, social security, medicare)
- Allowances and deductions management
- Payroll approval workflow
- Payroll summaries and reporting
- Multiple currency support

### ⏰ Time & Attendance
- Clock in/out functionality with location tracking
- Break and lunch time management
- Overtime calculation
- Timesheet generation and approval
- Attendance analytics and reporting
- Integration with payroll system

### 🏖️ Leave Management
- Multiple leave types (vacation, sick, personal, maternity, etc.)
- Leave balance tracking and entitlements
- Leave request workflow with approval process
- Leave calendar and scheduling
- Leave policies and rules configuration
- Leave analytics and reporting

### 📊 Performance Reviews
- Comprehensive performance evaluation system
- Multi-category rating system
- Goal setting and tracking
- Performance review workflow
- 360-degree feedback support
- Performance analytics and insights

### 🎯 Recruitment
- Job posting creation and management
- Applicant tracking system
- Interview scheduling and management
- Application workflow
- Recruitment analytics
- Integration with external job boards

### 🎓 Training Management
- Training program creation and management
- Employee enrollment and progress tracking
- Certification management
- Training calendar
- Mandatory training compliance
- Training analytics and reporting

### 🏥 Benefits Administration
- Benefits plan management
- Employee enrollment
- Dependent management
- Benefits cost tracking
- Open enrollment periods
- Benefits analytics

### 📈 HR Analytics
- Employee turnover analysis
- Performance metrics
- Attendance analytics
- Recruitment efficiency
- Training completion rates
- Benefits utilization
- Comprehensive HR dashboard

## API Endpoints

### Employee Management
- `GET /api/v1/employees` - Get all employees
- `GET /api/v1/employees/{id}` - Get employee by ID
- `POST /api/v1/employees` - Create new employee
- `PUT /api/v1/employees/{id}` - Update employee
- `DELETE /api/v1/employees/{id}` - Delete employee
- `GET /api/v1/employees/department/{department}` - Get employees by department
- `GET /api/v1/employees/statistics/summary` - Get employee statistics

### Payroll Management
- `GET /api/v1/payroll` - Get all payrolls
- `GET /api/v1/payroll/{id}` - Get payroll by ID
- `POST /api/v1/payroll` - Create payroll
- `PUT /api/v1/payroll/{id}` - Update payroll
- `POST /api/v1/payroll/{id}/approve` - Approve payroll
- `DELETE /api/v1/payroll/{id}` - Delete payroll
- `GET /api/v1/payroll/summary/period` - Get payroll summary

### Time & Attendance
- `GET /api/v1/attendance` - List attendance records (filters: `employee_id`, `date_from`, `date_to`)
- `POST /api/v1/attendance/clock-in` - Clock in
- `POST /api/v1/attendance/clock-out` - Clock out
- `GET /api/v1/attendance/{employee_id}/{date}` - Get attendance
- `GET /api/v1/attendance/{employee_id}/history` - Get attendance history
- `GET /api/v1/attendance/{employee_id}/timesheet` - Get timesheet
- `GET /api/v1/attendance/{employee_id}/summary` - Get attendance summary

### Leave Management
- `GET /api/v1/leave` - Get all leave requests
- `GET /api/v1/leave/{id}` - Get leave request
- `POST /api/v1/leave` - Create leave request
- `PUT /api/v1/leave/{id}` - Update leave request
- `POST /api/v1/leave/{id}/approve` - Approve leave
- `POST /api/v1/leave/{id}/reject` - Reject leave
- `GET /api/v1/leave/{employee_id}/balance` - Get leave balance

### Performance Reviews
- `GET /api/v1/performance/reviews` - Get performance reviews
- `GET /api/v1/performance/reviews/{id}` - Get performance review
- `POST /api/v1/performance/reviews` - Create performance review
- `PUT /api/v1/performance/reviews/{id}` - Update performance review
- `POST /api/v1/performance/reviews/{id}/submit` - Submit review
- `GET /api/v1/performance/{employee_id}/summary` - Get performance summary
- `GET /api/v1/performance/analytics` - Get performance analytics

### Recruitment
- `GET /api/v1/recruitment/jobs` - List job postings
- `GET /api/v1/recruitment/jobs/{job_id}` - Get job posting
- `POST /api/v1/recruitment/jobs` - Create job posting
- `PUT /api/v1/recruitment/jobs/{job_id}` - Update job posting
- `DELETE /api/v1/recruitment/jobs/{job_id}` - Delete job posting
- `GET /api/v1/recruitment/applications` - List applications
- `GET /api/v1/recruitment/applications/{application_id}` - Get application
- `POST /api/v1/recruitment/applications` - Create application
- `PUT /api/v1/recruitment/applications/{application_id}` - Update application
- `POST /api/v1/recruitment/applications/{application_id}/shortlist` - Shortlist application
- `POST /api/v1/recruitment/applications/{application_id}/reject` - Reject application
- `GET /api/v1/recruitment/interviews` - List interviews
- `GET /api/v1/recruitment/interviews/{interview_id}` - Get interview
- `POST /api/v1/recruitment/interviews` - Schedule interview
- `PUT /api/v1/recruitment/interviews/{interview_id}` - Update interview
- `GET /api/v1/recruitment/analytics` - Get recruitment analytics

The interview routes are defined, but `RecruitmentService` has no interview methods yet, so they currently return a 500 error.

### Training (read only)
- `GET /api/v1/training/programs` - List training programs (filters: `category`, `status`)
- `GET /api/v1/training/enrollments` - List enrollments (filters: `employee_id`, `training_program_id`, `status`)
- `GET /api/v1/training/summary` - Get training summary

### Benefits (read only)
- `GET /api/v1/benefits/plans` - List benefit plans (filters: `category`, `status`)
- `GET /api/v1/benefits/enrollments` - List enrollments (filters: `employee_id`, `plan_id`, `status`)
- `GET /api/v1/benefits/summary` - Get benefits summary

### HR Analytics
- `GET /api/v1/analytics/dashboard` - HR dashboard metrics (`period_days` 1-365, default 30; optional `department`)

List endpoints accept `skip` (default 0) and `limit` (default 100, max 1000).

## Database Schema

The service uses MongoDB (database `erp_hrm` by default) with these collections:

- `employees` - Employee records
- `payrolls` - Payroll information
- `attendance` - Time and attendance records
- `leaves` - Leave requests
- `performance_reviews` - Performance evaluation data
- `job_postings` - Recruitment job postings
- `applications` - Job applications
- `training_programs` - Training programs
- `employee_training` - Employee training enrollments
- `benefit_plans` - Benefits plans
- `employee_benefits` - Employee benefit enrollments

Indexes, including unique ones on employee `employee_id` and `email`, are created on startup in `app/database/connection.py`. There is no separate interviews or analytics collection; analytics are computed from the collections above.

## Configuration

Settings are read from environment variables or a `.env` file in the service folder (see `app/config.py`). Names are case-insensitive.

| Variable | Default | Purpose |
|---|---|---|
| `MONGODB_URL` | *(required)* | MongoDB connection string; the service will not start without it |
| `DATABASE_NAME` | `erp_hrm` | Database name |
| `SERVICE_NAME` | `HRM Service` | Name shown in logs and `/health` |
| `SERVICE_VERSION` | `1.0.0` | Service version |
| `SERVICE_HOST` | `0.0.0.0` | Bind address when started with `python main.py` |
| `SERVICE_PORT` | `8007` | Port when started with `python main.py` |
| `ENVIRONMENT` | `development` | `development` enables auto-reload with `python main.py` |
| `LOG_LEVEL` | `INFO` | Logging level |
| `DEBUG` | `true` | Debug flag |
| `AUTH_SERVICE_URL` | `http://auth-service:8001` | Auth service base URL |
| `NOTIFICATION_SERVICE_URL` | `http://notification-service:8004` | Notification service base URL |
| `SECRET_KEY` | `your-super-secret-key-change-this-in-production` | JWT secret; always override it |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `DEFAULT_CURRENCY` | `USD` | Default currency |
| `DEFAULT_TIMEZONE` | `UTC` | Default time zone |
| `MAX_LEAVE_DAYS_PER_YEAR` | `30` | Yearly leave allowance |
| `DEFAULT_WORKING_HOURS_PER_DAY` | `8.0` | Standard working day |
| `OVERTIME_THRESHOLD_HOURS` | `40.0` | Weekly hours before overtime |
| `OVERTIME_MULTIPLIER` | `1.5` | Overtime pay multiplier |
| `DEFAULT_TAX_RATE` | `0.20` | Income tax rate |
| `SOCIAL_SECURITY_RATE` | `0.062` | Social security rate |
| `MEDICARE_RATE` | `0.0145` | Medicare rate |
| `REVIEW_PERIOD_MONTHS` | `12` | Performance review period |
| `RATING_SCALE_MAX` | `5` | Highest review rating |
| `APPLICATION_EXPIRY_DAYS` | `30` | Days before an application expires |
| `INTERVIEW_SLOTS_PER_DAY` | `8` | Interview slots per day |
| `CERTIFICATION_VALIDITY_YEARS` | `2` | Certification validity |
| `MANDATORY_TRAINING_HOURS` | `40` | Required training hours |
| `HEALTH_INSURANCE_CONTRIBUTION` | `0.20` | Employer health insurance share |
| `RETIREMENT_MATCH_PERCENTAGE` | `0.05` | Employer retirement match |

`docker-compose.yml` sets most of these for local development, including `MONGODB_URL`, and takes `SECRET_KEY` from `JWT_SECRET_KEY`.

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set the required settings. There is no `.env.example` in this folder, so create `.env` yourself with at least:
```bash
MONGODB_URL=mongodb://localhost:27017
SECRET_KEY=<python3 -c "import secrets; print(secrets.token_urlsafe(64))">
```

3. Run the service:
```bash
python main.py
```

## Demo Data

`scripts/seed_demo_data.py` fills every HRM collection with sample data (50 employees plus payroll, attendance, leave, reviews, job postings, training and benefits). It deletes the existing data in those collections first, so do not run it against a database you want to keep.

```bash
python scripts/seed_demo_data.py
```

## Docker Deployment

```bash
# Build the image
docker build -t hrm-service .

# Run the container
docker run -p 8007:8007 -e MONGODB_URL=mongodb://host.docker.internal:27017 hrm-service
```

The image runs `uvicorn main:app` on port 8007 as a non-root user. In the full stack, `docker compose up hrm-service` starts it with the settings from `docker-compose.yml`.

## Frontend Integration

The service includes a comprehensive React frontend with:

- **Dashboard**: Overview of key HR metrics and activities
- **Employee Management**: Complete employee lifecycle management
- **Payroll Processing**: Salary calculation and payment processing
- **Attendance Tracking**: Time tracking and timesheet management
- **Leave Management**: Leave requests and approval workflow
- **Performance Reviews**: Employee evaluation and goal tracking
- **Recruitment**: Job posting and applicant management
- **Training**: Employee development and certification tracking
- **Benefits**: Benefits enrollment and management
- **Analytics**: HR metrics and reporting

## API Documentation

Once the service is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8007/docs`
- ReDoc: `http://localhost:8007/redoc`

## Health Check

The service provides a health check endpoint:
```
GET /health
```

## Security

What the code does today:

- **No token check on requests yet.** The routers use a placeholder `get_current_user` dependency that returns a fixed user instead of reading the `Authorization` header, and the training, benefits and analytics routes have no user dependency at all. `AuthService` in `app/services/auth_service.py` can verify a token against the auth service, but no route calls it. Keep the service behind the gateway or a private network until real checks are added.
- **CORS** allows all origins, methods and headers (`main.py`).
- **Trusted host middleware** is added when `ENVIRONMENT=production`, but it currently allows all hosts.
- **Input validation** comes from the Pydantic models and the `Query` limits on each route.
- There is no rate limiting in this service.

## Monitoring

The service includes comprehensive logging and monitoring:
- Structured logging with different levels
- Error tracking and reporting
- Performance metrics
- Health check endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
