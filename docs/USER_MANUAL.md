# 📘 User Manual - ERP System

**Version**: 1.0.0  
**Last Updated**: October 15, 2025

Welcome to your ERP System! This comprehensive guide will help you make the most of all features.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [User Management](#user-management)
4. [Inventory Management](#inventory-management)
5. [Sales Management](#sales-management)
6. [Payment Processing](#payment-processing)
7. [Reports & Analytics](#reports--analytics)
8. [Settings & Configuration](#settings--configuration)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Getting Started

### First Login

1. **Access the Application**
   - Open your browser and navigate to: `http://localhost:5173` (or your domain)
   
2. **Login Credentials**
   - Default admin email: `admin@example.com`
   - Default password: `admin123`
   - ⚠️ **Change this password immediately after first login!**

3. **Change Your Password**
   - Click on your profile icon (top right)
   - Select "Change Password"
   - Enter current password and new password
   - Click "Update Password"

### Navigation

The main navigation is on the left sidebar:
- **Dashboard** - Overview and statistics
- **Users** - User management (Admin only)
- **Inventory** - Product and stock management
- **Sales** - Customers, orders, and invoices
- **Settings** - System configuration

---

## Dashboard Overview

The dashboard provides a quick overview of your business.

### Key Metrics

**Top Statistics Cards:**
- **Total Sales** - Revenue for current period
- **Total Orders** - Number of orders
- **Total Products** - Items in inventory
- **Low Stock Items** - Products needing restock

### Charts & Graphs

1. **Sales Chart** - Daily/Weekly/Monthly sales trends
2. **Top Products** - Best-selling items
3. **Revenue Graph** - Revenue over time
4. **Order Status** - Pending, Completed, Cancelled orders

### Recent Activity

See the latest actions in your system:
- New orders
- Stock updates
- User activities
- System notifications

---

## User Management

**Access**: Dashboard → Users (Admin/Super Admin only)

### User Roles

The system has 6 predefined roles:

#### 1. **Super Admin** 🔴
- Full system access
- Can manage all users including admins
- Cannot be restricted
- Highest privilege level

#### 2. **Admin** 🟠
- Administrative access
- Can manage users (except Super Admins)
- Configure system settings
- View all reports

#### 3. **Manager** 🟡
- Team oversight
- Module-specific access
- Can view team reports
- Limited admin functions

#### 4. **Employee** 🟢
- Standard operational access
- Can process orders
- Manage inventory (if assigned)
- No admin features

#### 5. **Customer** 🔵
- Customer portal access
- View own orders
- Track shipments
- Update profile

#### 6. **Vendor** 🟣
- Vendor portal access
- Manage product inventory
- View orders
- Limited to vendor functions

### Managing Users

#### Create a New User

1. Go to **Dashboard → Users**
2. Click **"Add User"** button
3. Fill in the form:
   - **Email** - Must be unique
   - **Password** - Min 8 characters
   - **First Name** - User's first name
   - **Last Name** - User's last name
   - **Role** - Select from dropdown
   - **Department** - Optional
   - **Phone** - Optional
4. Click **"Create User"**

#### Edit User

1. Find the user in the list
2. Click the **Edit** icon
3. Update information
4. Click **"Save Changes"**

#### Delete User

1. Find the user in the list
2. Click the **Delete** icon
3. Confirm deletion in the modal
4. User will be removed

#### Search & Filter

- **Search Box** - Search by email or name
- **Role Filter** - Filter by user role
- **Status Filter** - Active/Inactive users
- **Department Filter** - Filter by department

### Permissions Management

Each role has specific permissions:

| Permission | Super Admin | Admin | Manager | Employee |
|------------|-------------|-------|---------|----------|
| User Management | ✅ | ✅ | ❌ | ❌ |
| Inventory Create | ✅ | ✅ | ✅ | ✅ |
| Inventory Delete | ✅ | ✅ | ❌ | ❌ |
| Sales Create | ✅ | ✅ | ✅ | ✅ |
| View Reports | ✅ | ✅ | ✅ | ❌ |
| System Settings | ✅ | ✅ | ❌ | ❌ |

### Session Management

**Access**: Dashboard → Sessions

- View all active sessions
- See IP addresses and devices
- Last activity time
- Terminate suspicious sessions

### Audit Logs

**Access**: Dashboard → Audit Logs

Track all user activities:
- Login/Logout events
- Create/Update/Delete actions
- Failed login attempts
- System changes

**Filter logs by:**
- User
- Action type
- Date range
- Status (success/failure)

**Export logs** to CSV for compliance.

---

## Inventory Management

**Access**: Dashboard → Inventory

Manage your products, categories, warehouses, and stock levels.

### Products

#### View Products

1. Go to **Inventory → Products**
2. See all products in a table with:
   - Product name and SKU
   - Category
   - Stock level
   - Prices (Cost, Retail, Wholesale)
   - Stock status badge

#### Add a Product

1. Click **"Add Product"** button
2. Fill in the **Basic Information**:
   - **Product Name** - Required
   - **SKU** - Unique product code
   - **Description** - Product details
   - **Category** - Select from dropdown

3. Set **Pricing**:
   - **Cost Price** - Your cost
   - **Retail Price** - Selling price
   - **Wholesale Price** - Bulk price

4. Configure **Inventory**:
   - **Initial Stock** - Starting quantity
   - **Low Stock Threshold** - Alert level
   - **Warehouse** - Storage location

5. Add **Additional Details**:
   - **Brand** - Product brand
   - **Barcode** - Barcode number
   - **Tags** - For searching
   - **Status** - Active/Inactive

6. Upload **Product Image** (optional)

7. Click **"Create Product"**

#### Edit Product

1. Find product in list
2. Click **Edit** icon
3. Update information
4. Click **"Save Changes"**

#### Delete Product

1. Click **Delete** icon
2. Confirm deletion
3. Product removed from system

#### Product Search

- Use search box to find products
- Filter by category
- Filter by stock status
- Sort by name, SKU, or stock

### Categories

Organize products into categories.

#### View Categories

Go to **Inventory → Categories** to see all categories.

#### Add Category

1. Click **"Add Category"**
2. Enter:
   - **Name** - Category name
   - **Description** - Category details
   - **Parent Category** - For sub-categories (optional)
3. Click **"Create Category"**

#### Hierarchical Categories

Create sub-categories for better organization:
```
Electronics
  ├── Computers
  │   ├── Laptops
  │   └── Desktops
  └── Peripherals
      ├── Keyboards
      └── Mice
```

### Warehouses

Manage multiple storage locations.

#### Add Warehouse

1. Go to **Inventory → Warehouses**
2. Click **"Add Warehouse"**
3. Fill in details:
   - **Name** - Warehouse name
   - **Code** - Unique code (e.g., WH-01)
   - **Location** - Street address
   - **City, State, ZIP**
   - **Contact Person**
   - **Phone & Email**
   - **Main Warehouse** - Yes/No
4. Click **"Create Warehouse"**

### Stock Management

**Access**: Inventory → Stock Management

#### View Stock Levels

See real-time stock for all products across warehouses.

#### Adjust Stock

**Add Stock (Received):**
1. Find product
2. Click **"Adjust Stock"**
3. Select **"Add Stock"**
4. Enter quantity
5. Select warehouse
6. Add reason: "Purchase order received"
7. Click **"Update Stock"**

**Reduce Stock (Damaged/Lost):**
1. Click **"Adjust Stock"**
2. Select **"Reduce Stock"**
3. Enter quantity
4. Add reason: "Damaged items"
5. Click **"Update Stock"**

#### Transfer Stock

Move stock between warehouses:
1. Select product
2. Click **"Transfer Stock"**
3. Select **From Warehouse**
4. Select **To Warehouse**
5. Enter quantity
6. Add notes
7. Click **"Transfer"**

#### Low Stock Alerts

Products below threshold show:
- 🟡 Yellow badge - Low stock
- 🔴 Red badge - Out of stock

---

## Sales Management

**Access**: Dashboard → Sales

Manage customers, orders, invoices, and quotes.

### Customers

#### Add Customer

1. Go to **Sales → Customers**
2. Click **"Add Customer"**
3. Enter **Basic Information**:
   - **Name** - Customer name
   - **Email** - Contact email
   - **Phone** - Contact number

4. Add **Address**:
   - **Street Address**
   - **City, State, ZIP**
   - **Country**

5. Optional Details:
   - **Tax ID** - For invoicing
   - **Notes** - Customer notes

6. Click **"Create Customer"**

#### View Customer Details

1. Click on customer row
2. See:
   - Contact information
   - Order history
   - Total purchases
   - Outstanding invoices

### Sales Orders

#### Create an Order

1. Go to **Sales → Orders**
2. Click **"Create Order"**

3. **Select Customer**:
   - Choose from dropdown
   - Or create new customer

4. **Add Line Items**:
   - Click **"+ Add Item"**
   - Select product from dropdown
   - Enter quantity
   - Price auto-fills
   - See line total
   - Repeat for multiple items

5. **Review Totals**:
   - Subtotal - Sum of line items
   - Tax - If applicable
   - Discount - If applicable
   - **Grand Total** - Final amount

6. **Choose Payment Method**:
   - Cash
   - Credit Card (Stripe)
   - Bank Transfer
   - Check

7. Add **Order Notes** (optional)

8. Click **"Create Order"**

#### Order Status Flow

```
Draft → Pending → Confirmed → Processing → Completed
                    ↓
                Cancelled
```

**Status Meanings:**
- **Draft** - Order being created
- **Pending** - Awaiting confirmation
- **Confirmed** - Order confirmed
- **Processing** - Being prepared
- **Completed** - Fulfilled
- **Cancelled** - Cancelled

#### View Order Details

1. Click on order
2. See:
   - Customer information
   - Line items table
   - Order totals
   - Status badges
   - Payment status
   - Order notes

#### Edit Order

1. Open order details
2. Click **"Edit Order"**
3. Update items or details
4. Click **"Save Changes"**

### Invoices

Invoices are automatically generated from orders.

#### View Invoices

Go to **Sales → Invoices** to see all invoices.

#### Invoice Status

- **Draft** - Not yet sent
- **Sent** - Sent to customer
- **Paid** - Payment received
- **Overdue** - Past due date

#### Generate Invoice from Order

1. Open order details
2. Click **"Generate Invoice"**
3. Invoice created automatically
4. Send to customer via email

---

## Payment Processing

Process payments securely with multiple methods.

### Payment Methods

1. **Cash** - Manual cash payment
2. **Stripe** - Credit/Debit cards
3. **Bank Transfer** - Manual transfer
4. **Check** - Check payment

### Stripe Payments

#### Process Credit Card Payment

1. Create order with **"Credit Card (Stripe)"**
2. Order detail page opens
3. Payment modal appears automatically
4. Customer enters card details:
   - **Card Number**
   - **Expiry Date**
   - **CVC**
   - **ZIP Code**
5. Click **"Pay $XX.XX"**
6. Payment processes securely
7. Order status updates to **"Paid"**
8. Success notification appears

#### Test Stripe Payments

Use these test cards in development:

| Card Number | Result | Use Case |
|-------------|--------|----------|
| 4242 4242 4242 4242 | ✅ Success | Standard payment |
| 4000 0025 0000 3155 | 🔐 3D Secure | Requires authentication |
| 4000 0000 0000 9995 | ❌ Declined | Insufficient funds |

**Test Card Details:**
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### Manual Payments

#### Record Cash Payment

1. Open order
2. Click **"Record Payment"**
3. Select **"Cash"**
4. Enter amount received
5. Add receipt number (optional)
6. Click **"Record Payment"**

#### Record Bank Transfer

1. Click **"Record Payment"**
2. Select **"Bank Transfer"**
3. Enter transfer reference
4. Enter date received
5. Click **"Record Payment"**

### Payment Status

- **Pending** 🟡 - Awaiting payment
- **Paid** 🟢 - Payment received
- **Failed** 🔴 - Payment failed
- **Refunded** 🔵 - Payment refunded

---

## Reports & Analytics

**Access**: Dashboard → Reports (Coming Soon)

### Available Reports

#### Sales Reports
- Daily sales summary
- Weekly sales trends
- Monthly revenue
- Sales by product
- Sales by customer
- Top selling products

#### Inventory Reports
- Stock levels
- Low stock items
- Stock movements
- Inventory valuation
- Product performance

#### Financial Reports
- Revenue reports
- Profit margins
- Outstanding payments
- Tax reports

### Export Reports

All reports can be exported:
- **PDF** - Professional format
- **Excel** - Spreadsheet format
- **CSV** - Data format

---

## Settings & Configuration

**Access**: Dashboard → Settings (Admin only)

### Company Information

Update your company details:
- Company name
- Address
- Contact information
- Tax ID
- Logo

### Email Configuration

Set up email notifications:
- SMTP server
- Email credentials
- From address
- Email templates

### Payment Gateway

Configure Stripe:
- Publishable key
- Secret key
- Test/Live mode
- Webhook URL

### Security Settings

**Password Policy:**
- Minimum length
- Require uppercase
- Require numbers
- Require special characters
- Password expiry days

**Login Security:**
- Max login attempts
- Lockout duration
- Session timeout

**Advanced:**
- Enable 2FA (coming soon)
- IP whitelist (coming soon)

### System Preferences

- Date format
- Time zone
- Currency
- Language (coming soon)
- Number format

---

## Troubleshooting

### Common Issues

#### Cannot Login

**Problem**: Login fails with error message

**Solutions:**
1. Check email and password are correct
2. Ensure Caps Lock is off
3. Try password reset
4. Clear browser cache
5. Contact administrator

#### Products Not Showing

**Problem**: Products list is empty

**Solutions:**
1. Check if filters are applied
2. Verify products are active
3. Check user permissions
4. Refresh the page

#### Payment Failed

**Problem**: Stripe payment fails

**Solutions:**
1. Check card details are correct
2. Verify Stripe is configured
3. Use test cards in development
4. Check internet connection
5. Try different card

#### Stock Not Updating

**Problem**: Stock levels not changing

**Solutions:**
1. Refresh the page
2. Check warehouse is selected
3. Verify permissions
4. Check for errors in console

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| 401 Unauthorized | Not logged in | Login again |
| 403 Forbidden | No permission | Contact admin |
| 404 Not Found | Resource missing | Check URL |
| 500 Server Error | Backend issue | Contact support |

### Getting Help

1. **Check Documentation** - This manual
2. **Search FAQ** - Common questions
3. **Contact Support**:
   - Email: support@yourdomain.com
   - Response time: < 24 hours
   - Include error messages and screenshots

---

## FAQ

### General Questions

**Q: How do I change my password?**  
A: Click your profile icon → Change Password

**Q: Can I customize the logo?**  
A: Yes, go to Settings → Company Information

**Q: How many users can I create?**  
A: Unlimited users

**Q: Is my data backed up?**  
A: Yes, automatic daily backups (configure in Settings)

### User Management

**Q: What's the difference between Admin and Manager?**  
A: Admins can manage users; Managers cannot

**Q: Can I create custom roles?**  
A: Not yet, coming in v1.1.0

**Q: How do I reset a user's password?**  
A: Edit user → Set new password

### Inventory

**Q: Can I import products from Excel?**  
A: Coming in v1.1.0

**Q: How do I track serial numbers?**  
A: Use the barcode field or product notes

**Q: Can I have multiple warehouses?**  
A: Yes, unlimited warehouses

**Q: What happens when stock is 0?**  
A: Product shows as "Out of Stock"

### Sales & Orders

**Q: Can customers place orders themselves?**  
A: Yes, with customer portal access

**Q: How do I cancel an order?**  
A: Open order → Change status to Cancelled

**Q: Can I edit completed orders?**  
A: No, completed orders are locked

**Q: How do I send invoices?**  
A: Invoice page → Send button

### Payments

**Q: Is Stripe required?**  
A: No, you can use cash/manual payments

**Q: What currencies are supported?**  
A: Currently USD, more coming soon

**Q: Are payments secure?**  
A: Yes, Stripe handles all card data

**Q: Can I process refunds?**  
A: Yes, through Stripe dashboard

### Technical

**Q: What browsers are supported?**  
A: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

**Q: Is mobile supported?**  
A: Yes, fully responsive design

**Q: Can I access offline?**  
A: No, internet connection required

**Q: How do I update to new version?**  
A: See UPDATE_GUIDE.md

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Close modal |
| `Tab` | Navigate forms |
| `/` | Focus search (coming soon) |

---

## Best Practices

### For Administrators

1. ✅ Change default passwords immediately
2. ✅ Create separate user accounts (don't share)
3. ✅ Review audit logs regularly
4. ✅ Keep software updated
5. ✅ Configure regular backups
6. ✅ Test payment flows in test mode first
7. ✅ Set up email notifications
8. ✅ Train users before giving access

### For Users

1. ✅ Use strong passwords
2. ✅ Logout when finished
3. ✅ Double-check orders before confirming
4. ✅ Keep customer information updated
5. ✅ Review stock levels regularly
6. ✅ Save work frequently
7. ✅ Report issues promptly

### For Sales

1. ✅ Verify customer details
2. ✅ Check stock availability
3. ✅ Calculate totals correctly
4. ✅ Select correct payment method
5. ✅ Confirm payment received
6. ✅ Update order status promptly
7. ✅ Generate invoices on time

---

## Glossary

**SKU** - Stock Keeping Unit, unique product identifier  
**ERP** - Enterprise Resource Planning  
**RBAC** - Role-Based Access Control  
**Stripe** - Payment processing service  
**JWT** - JSON Web Token (authentication)  
**API** - Application Programming Interface  
**CRUD** - Create, Read, Update, Delete  
**2FA** - Two-Factor Authentication  

---

## Support

### Getting Help

**Email Support**: support@yourdomain.com  
**Response Time**: Within 24 hours  
**Live Chat**: Available (coming soon)  

**Before Contacting Support:**
1. Check this manual
2. Search the FAQ
3. Check for error messages
4. Take screenshots

**Include in Support Request:**
1. Your email/account
2. What you were trying to do
3. Error message (exact text)
4. Screenshots
5. Browser and version

---

## Updates & Changelog

**Current Version**: 1.0.0

See [CHANGELOG.md](../CHANGELOG.md) for version history and upcoming features.

**Planned Features:**
- Multi-language support (v1.1.0)
- Advanced reporting (v1.1.0)
- Mobile app (v2.0.0)

---

## Feedback

We value your feedback! Help us improve:

**Feature Requests**: features@yourdomain.com  
**Bug Reports**: bugs@yourdomain.com  
**General Feedback**: feedback@yourdomain.com  

---

**Thank you for choosing our ERP System!** 🎉

For technical documentation, see [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)

---

*Last Updated: October 15, 2025*  
*Version: 1.0.0*  
*© 2025 Your Company. All rights reserved.*

