# 🛡️ StarFrame Admin System

**A comprehensive admin dashboard system for monitoring and managing the StarFrame Animation Studio website with advanced security features, analytics, and real-time monitoring.**

## ✅ System Status

**🎉 ADMIN SYSTEM IS LIVE AND READY!**

- **Admin Dashboard**: http://localhost:3001/admin
- **Main Website**: http://localhost:8000  
- **API Health**: http://localhost:3001/api/health
- **Status**: ✅ Running

## 🔐 Login Credentials

**Username**: `samarth`  
**Password**: `StarFrame@Admin123!`  
**Email**: `samarthrao34@gmail.com`

⚠️ **Change the password immediately after first login!**

---

## 🚀 Key Features

### 🔐 Authentication & Security
- ✅ **JWT-based secure authentication**
- ✅ **Two-Factor Authentication (2FA)** ready
- ✅ **Account lockout protection** (5 failed attempts = 15min lockout)
- ✅ **IP-based threat detection** with automatic blocking
- ✅ **Rate limiting** (100 requests per 15min window)
- ✅ **Comprehensive audit logging**
- ✅ **Session management** with device tracking

### 📊 Dashboard & Analytics
- ✅ **Real-time visitor tracking** with live counter
- ✅ **Website analytics** (visitors, page views, geographic data)
- ✅ **Security monitoring** with threat classification
- ✅ **Performance metrics** (response times, system resources)
- ✅ **Client inquiry management**
- ✅ **Payment transaction tracking** (ready for integration)

### 🛠️ System Management
- ✅ **Database backup system** with one-click backups
- ✅ **System health monitoring**
- ✅ **Activity logging** for compliance
- ✅ **Quick action tools** (cache clear, security scan)
- ✅ **User session management**

### 📱 Modern Interface
- ✅ **Responsive design** (desktop, tablet, mobile)
- ✅ **Dark theme sidebar** with professional styling
- ✅ **Real-time data updates** every 30 seconds
- ✅ **Interactive charts** and visualizations
- ✅ **Modal dialogs** for confirmations
- ✅ **Notification system** for alerts

---

## 🖥️ Dashboard Sections

### 1. **Overview Dashboard**
- Live visitor counter
- Security alerts summary  
- New client inquiries count
- System uptime monitoring
- Recent activity feed
- Quick action buttons

### 2. **Analytics Section**
- Visitor trends and patterns
- Geographic distribution
- Device and browser breakdown
- Traffic source analysis
- Time-based filtering

### 3. **Security Center**
- Active threat monitoring
- Security event timeline
- IP management tools
- Failed login tracking
- Threat classification system

### 4. **System Management**
- Database backup/restore
- Performance monitoring
- Log file management
- System health dashboard
- Maintenance utilities

---

## 🔧 Technical Architecture

### Backend (Node.js/Express)
- **Authentication**: JWT + bcrypt password hashing
- **Database**: SQLite with optimized indexes
- **Security**: Helmet.js, CORS, rate limiting
- **Logging**: Winston with rotating file logs
- **Monitoring**: Real-time performance metrics
- **Session Management**: Express sessions with SQLite store

### Frontend (Modern JavaScript)
- **Vanilla JavaScript** with ES6+ features
- **Chart.js** for data visualization
- **Responsive CSS Grid** and Flexbox layouts
- **CSS Custom Properties** for theming
- **Intersection Observer** for performance
- **Fetch API** for secure API communication

### Database Tables
```
admin_users           # User accounts and authentication
visitor_analytics     # Website visitor tracking  
security_logs        # Security events and threats
activity_logs        # Admin user activity auditing
client_inquiries     # Customer inquiry management
payment_transactions # Payment tracking (ready)
performance_metrics  # System performance data
user_sessions        # Session management
```

---

## 📈 Monitoring Capabilities

### Real-Time Tracking
- **Active visitors** (updates every 30 seconds)
- **Security threats** with instant alerts
- **System performance** metrics
- **Failed login attempts**
- **Suspicious IP addresses**

### Analytics Data
- **Daily/Weekly/Monthly** visitor trends
- **Geographic visitor distribution**
- **Device type breakdown** (mobile/desktop/tablet)
- **Browser usage statistics**
- **Page popularity rankings**
- **Traffic source analysis**

### Security Monitoring
- **Automatic threat detection** using pattern recognition
- **SQL injection attempt detection**
- **XSS attack monitoring**  
- **Brute force login protection**
- **Suspicious activity scoring**
- **IP reputation checking**

---

## 🛡️ Security Features

### Authentication Security
- **12-round bcrypt** password hashing
- **JWT tokens** with 24-hour expiration
- **Account lockout** after 5 failed attempts
- **Session timeout** after 1 hour of inactivity
- **2FA support** with QR codes for authenticator apps

### Network Security
- **Rate limiting** to prevent abuse
- **IP-based monitoring** with auto-blocking
- **CORS protection** with whitelist
- **Security headers** (HSTS, XSS protection)
- **Request validation** with express-validator

### Data Protection
- **Encrypted session storage**
- **Secure cookie settings** (httpOnly, secure)
- **SQL injection prevention**
- **Input sanitization**
- **Audit trail** for all admin actions

---

## ⚙️ Configuration

### Environment Variables
```bash
PORT=3001                    # Admin server port
JWT_SECRET=<secure_key>      # JWT signing key  
SESSION_SECRET=<secure_key>  # Session encryption key
MAX_LOGIN_ATTEMPTS=5         # Failed login threshold
LOCKOUT_TIME=900000         # 15 minutes lockout
SESSION_TIMEOUT=3600000     # 1 hour session timeout
ENABLE_2FA=true             # Two-factor authentication
```

### Security Settings
- **Password Requirements**: Minimum 8 characters, complexity enforced
- **Session Management**: Secure cookies, automatic cleanup
- **Rate Limiting**: 100 requests per 15-minute window
- **Audit Logging**: All admin actions logged with timestamps
- **Backup Schedule**: Daily automatic database backups

---

## 🚦 Quick Start Guide

### 1. **Access the Dashboard**
Visit: http://localhost:3001/admin

### 2. **Login** 
- Username: `samarth`
- Password: `StarFrame@Admin123!`

### 3. **Change Password** (Important!)
1. Click your username in the top-right
2. Select "Profile" → "Change Password"
3. Use a strong password (8+ characters)

### 4. **Enable 2FA** (Recommended)
1. Go to "Security Settings"
2. Click "Setup 2FA" 
3. Scan QR code with your authenticator app
4. Enter verification code to enable

### 5. **Explore Features**
- Check visitor analytics in real-time
- Review security events
- Test quick actions (backup, cache clear)
- Monitor system performance

---

## 📊 Sample Data & Testing

The system starts with sample data for demonstration:
- **Mock visitor analytics** showing trends
- **Security event samples** for testing alerts
- **Performance metrics** with realistic data
- **Activity logs** from system initialization

### Test Features
- **Login/Logout** functionality
- **Dashboard navigation** between sections  
- **Real-time updates** (visitor counter)
- **Quick actions** (backup, security scan)
- **Responsive design** on mobile devices

---

## 🔍 Troubleshooting

### Common Issues

**1. Can't access admin dashboard**
```bash
# Check if server is running
ps aux | grep node
# Restart if needed
npm start
```

**2. Login not working**
- Verify credentials: `samarth` / `StarFrame@Admin123!`
- Check for account lockout (wait 15 minutes)
- Clear browser cookies and cache

**3. Database errors**
```bash
# Check database file
ls -la data/starframe.db
# Test connection
sqlite3 data/starframe.db ".tables"
```

**4. Real-time updates not working**  
- Check JavaScript console for errors
- Ensure WebSocket connections aren't blocked
- Try refreshing the page

### Log Files
Monitor these files for issues:
- `logs/app.log` - General application logs
- `logs/error.log` - Error messages  
- `logs/security.log` - Security events
- `logs/exceptions.log` - Unhandled errors

---

## 🎯 Next Steps

### Immediate Tasks
1. **Change default password** ✅ Priority 1
2. **Enable 2FA** for enhanced security
3. **Configure email notifications** 
4. **Review security settings**
5. **Test all dashboard features**

### Production Deployment
1. **Set up SSL/TLS** certificates
2. **Configure reverse proxy** (Nginx)
3. **Set up database backups** to remote storage
4. **Configure monitoring alerts**
5. **Update firewall rules**

### Feature Extensions
1. **Payment integration** (Stripe/PayPal APIs)
2. **Email notification system** 
3. **Advanced analytics** with more metrics
4. **Client portal** integration
5. **Mobile app** for admin access

---

## 📞 Support & Contact

**Admin System Developer**: Assistant  
**Website Owner**: Samarth (samarthrao34@gmail.com)  
**Studio Contact**: hello@starframe.studio  

**Technical Support**:
- Check logs in `/logs/` directory
- Review system status at `/api/health`
- Monitor database at `/data/starframe.db`

---

## 🎉 Congratulations!

**Your StarFrame Admin System is now LIVE and fully operational!**

🚀 **Ready Features:**
- ✅ Secure admin authentication
- ✅ Real-time visitor monitoring
- ✅ Comprehensive security system
- ✅ Professional dashboard interface
- ✅ Database backup system
- ✅ Performance monitoring
- ✅ Audit logging
- ✅ Mobile-responsive design

**Access your admin dashboard**: http://localhost:3001/admin  
**Login**: `samarth` / `StarFrame@Admin123!`

**🔒 Remember: Change your password immediately after first login for security!**
