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
- `GET /api/v1/payroll/summary/period` - Get payroll summary

### Time & Attendance
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

## Database Schema

The service uses MongoDB with the following main collections:

- `employees` - Employee records
- `payrolls` - Payroll information
- `attendance` - Time and attendance records
- `leaves` - Leave requests and balances
- `performance_reviews` - Performance evaluation data
- `job_postings` - Recruitment job postings
- `applications` - Job applications
- `interviews` - Interview scheduling
- `trainings` - Training programs
- `employee_trainings` - Employee training enrollments
- `benefits` - Benefits plans
- `employee_benefits` - Employee benefit enrollments
- `hr_analytics` - HR metrics and analytics

## Configuration

The service can be configured using environment variables:

```bash
# Service Configuration
SERVICE_NAME=HRM Service
SERVICE_VERSION=1.0.0
SERVICE_HOST=0.0.0.0
SERVICE_PORT=8007

# Database
MONGODB_URL=mongodb://admin:password123@mongodb:27017/erp_hrm?authSource=admin
DATABASE_NAME=erp_hrm

# External Services
AUTH_SERVICE_URL=http://auth-service:8001
NOTIFICATION_SERVICE_URL=http://notification-service:8004

# JWT Configuration
SECRET_KEY=REDACTED
ALGORITHM=HS256

# HRM Specific Settings
DEFAULT_CURRENCY=USD
DEFAULT_TIMEZONE=UTC
MAX_LEAVE_DAYS_PER_YEAR=30
DEFAULT_WORKING_HOURS_PER_DAY=8.0
OVERTIME_THRESHOLD_HOURS=40.0
OVERTIME_MULTIPLIER=1.5
DEFAULT_TAX_RATE=0.20
SOCIAL_SECURITY_RATE=0.062
MEDICARE_RATE=0.0145
```

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run the service:
```bash
python main.py
```

## Docker Deployment

The service is configured for Docker deployment:

```bash
# Build the image
docker build -t hrm-service .

# Run the container
docker run -p 8007:8007 hrm-service
```

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

- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Rate limiting (configurable)

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
