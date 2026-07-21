const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Session = require('./models/Session');
const Mentorship = require('./models/Mentorship');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize()); 

// --- Middleware ---
const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) { res.status(401).json({ message: 'Not authorized' }); }
  } else { res.status(401).json({ message: 'No token' }); }
};

// --- PASSPORT CONFIG ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8000/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      if (!email.endsWith('@smail.iitm.ac.in')) {
        return done(new Error("Only @smail.iitm.ac.in emails allowed"), null);
      }
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: profile.displayName,
          email,
          role: 'mentee',
          department: 'Not Specified',
          isVerified: true
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));



// --- GOOGLE AUTH ROUTES (Public, no protect needed) ---
app.get('/api/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// In server.js
app.get('/api/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:5174/login?error=invalid_domain',
    session: false
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    // ✅ Save user object too (encode as URL param or use a different approach)
    const userData = encodeURIComponent(JSON.stringify({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department
    }));
    
    res.redirect(`http://localhost:5174/dashboard?token=${token}&user=${userData}`);
  }
);
// --- Routes ---

// Auth
// Inside your /api/auth/login route
// LOGIN ROUTE - Place this BEFORE app.listen()
// In server.js - Standard Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // ✅ RETURN USER DATA EXPLICITLY
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Users (Admin only)
// GET /api/users - Admin sees ALL users, Coordinator sees ONLY their dept
app.get('/api/users', protect, async (req, res) => {
  try {
    let query = {};
    
    // Admins see everyone; Coordinators see only their department
    if (req.user.role === 'coordinator') {
      query.department = req.user.department;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins and coordinators can view users' });
    }
    
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (err) {
    console.error('Users fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.post('/api/users', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const user = await User.create(req.body);
  res.status(201).json(user);
});

// Sessions (Mentor/Mentee/Coordinator logic)
// GET /api/sessions - Role-aware session fetching
app.get('/api/sessions', protect, async (req, res) => {
  try {
    let sessions = [];

    if (req.user.role === 'mentor') {
      // 1. Find all active mentorships where THIS user is the MENTOR
      const myMentorships = await Mentorship.find({ 
        mentor: req.user._id, 
        status: 'active' 
      });
      
      if (myMentorships.length === 0) {
        return res.json([]); // No mentorships = no sessions
      }
      
      const mentorshipIds = myMentorships.map(m => m._id);
      
      // 2. Fetch sessions for these mentorships AND populate mentee details
      sessions = await Session.find({ 
        mentorship: { $in: mentorshipIds } 
      })
      .populate({
        path: 'mentorship',
        populate: { 
          path: 'mentee', 
          select: 'name email department' 
        }
      })
      .sort({ scheduledDate: -1 });

    } else if (req.user.role === 'mentee') {
      // Original mentee logic (keep as-is)
      const myMentorships = await Mentorship.find({ 
        mentee: req.user._id, 
        status: 'active' 
      });
      
      const mentorshipIds = myMentorships.map(m => m._id);
      
      sessions = await Session.find({ 
        mentorship: { $in: mentorshipIds } 
      })
      .populate({
        path: 'mentorship',
        populate: { 
          path: 'mentor', 
          select: 'name email' 
        }
      })
      .sort({ scheduledDate: -1 });

    } else {
      // Coordinators/Admins see all sessions (optional)
      sessions = await Session.find({})
        .populate('mentorship')
        .sort({ scheduledDate: -1 });
    }
    
    console.log(`📊 Returning ${sessions.length} sessions for ${req.user.role}: ${req.user.name}`);
    res.json(sessions);
  } catch (err) {
    console.error('❌ Sessions fetch error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/sessions/:id/verify', protect, async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (session) {
    session.menteeValidation = {
      status: req.body.status,
      comments: req.body.comments,
      validatedAt: new Date()
    };
    session.status = req.body.status === 'approved' ? 'mentee_verified' : 'rejected';
    await session.save();
    res.json(session);
  } else { res.status(404).json({ message: 'Session not found' }); }
});

// GET /api/mentorships - Get all mentorships
app.get('/api/mentorships', protect, async (req, res) => {
  const mentorships = await Mentorship.find().populate('mentor mentee allottedBy');
  res.json(mentorships);
});

// POST /api/mentorships - Create new mentorship
app.post('/api/mentorships', protect, async (req, res) => {
  const { mentorId, menteeId } = req.body;
  const mentor = await User.findById(mentorId);
  const mentee = await User.findById(menteeId);
  
  if (!mentor || !mentee) return res.status(404).json({ message: 'User not found' });
  
  const mentorship = await Mentorship.create({
    mentor: mentorId,
    mentee: menteeId,
    department: mentor.department,
    hostel: mentee.hostel,
    status: 'active',
    allottedBy: req.user._id
  });
  
  res.status(201).json(mentorship);
});

// PUT /api/sessions/:id/review - Coordinator final review
app.put('/api/sessions/:id/review', protect, async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  
  session.status = req.body.action === 'approve' ? 'approved' : 'coordinator_rejected';
  session.coordinatorReview = {
    action: req.body.action,
    reviewedBy: req.user._id,
    reviewedAt: new Date()
  };
  
  await session.save();
  res.json(session);
});

// GET /api/analytics/departments - Aggregated department stats
app.get('/api/analytics/departments', protect, async (req, res) => {
  try {
    const departments = ['Computer Science', 'Biotechnology', 'Mechanical', 'Civil', 'Electrical'];
    
    const stats = await Promise.all(departments.map(async (deptName) => {
      // Get all mentorships in this department
      const mentorships = await Mentorship.find({ department: deptName, status: 'active' });
      const mentorIds = mentorships.map(m => m.mentor);
      
      // Get all sessions for these mentorships
      const sessions = await Session.find({ 
        mentorship: { $in: mentorships.map(m => m._id) } 
      });
      
      const verified = sessions.filter(s => s.status === 'mentee_verified' || s.status === 'approved').length;
      const total = sessions.length || 1; // Avoid division by zero
      
      // Count inactive mentors (no session in last 14 days)
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const activeMentorIds = new Set(
        sessions
          .filter(s => new Date(s.scheduledDate) > twoWeeksAgo)
          .map(s => s.mentorship?.mentor)
      );
      const inactiveCount = mentorIds.filter(id => !activeMentorIds.has(id.toString())).length;

      return {
        name: deptName,
        totalMentors: mentorships.length,
        activeMentors: mentorships.length - inactiveCount,
        inactiveMentors: inactiveCount,
        totalSessions: sessions.length,
        verificationRate: Math.round((verified / total) * 100)
      };
    }));

    res.json(stats);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Failed to load analytics' });
  }
});

app.post('/api/users/bulk-import', protect, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  
  try {
    const Papa = require('papaparse');
    const csvText = req.file.buffer.toString('utf-8');
    
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const rows = parsed.data;
    
    let created = 0;
    let skipped = 0;
    
    for (const row of rows) {
      // Validate required fields
      if (!row.name || !row.email || !row.role || !row.department) {
        skipped++;
        continue;
      }
      
      // Validate email domain
      if (!row.email.endsWith('@smail.iitm.ac.in')) {
        skipped++;
        continue;
      }
      
      // Check duplicate
      const existing = await User.findOne({ email: row.email.toLowerCase() });
      if (existing) {
        skipped++;
        continue;
      }
      
      // Create user with hashed password
      const hash = await bcrypt.hash(row.password || 'password123', 10);
      await User.create({
        name: row.name,
        email: row.email.toLowerCase(),
        password: hash,
        role: row.role,
        department: row.department,
        hostel: row.hostel || ''
      });
      created++;
    }
    
    res.json({ success: true, created, skipped });
  } catch (err) {
    console.error('Bulk import error:', err);
    res.status(500).json({ message: 'Import failed: ' + err.message });
  }
});

// GET /api/analytics/departments - Real-time institute analytics
app.get('/api/analytics/departments', protect, async (req, res) => {
  try {
    // Dynamically get all unique departments from active mentorships
    const departments = await Mentorship.distinct('department', { status: 'active' });
    
    if (departments.length === 0) {
      return res.json([]);
    }

    const stats = await Promise.all(departments.map(async (deptName) => {
      // Get active mentorships in this department
      const deptMentorships = await Mentorship.find({ 
        department: deptName, 
        status: 'active' 
      });
      
      const mentorIds = new Set(deptMentorships.map(m => m.mentor.toString()));
      const mentorshipIds = deptMentorships.map(m => m._id);
      
      // ✅ USE UNIQUE VARIABLE NAME TO AVOID CONFLICTS
      const deptSessions = await Session.find({ 
        mentorship: { $in: mentorshipIds } 
      });
      
      // Calculate verification rate
      const verifiedCount = deptSessions.filter(s => 
        s.status === 'mentee_verified' || s.status === 'approved'
      ).length;
      const totalSessions = deptSessions.length || 1;
      
      // Calculate inactive mentors (>14 days since last session)
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const recentSessionMentors = new Set(
        deptSessions
          .filter(s => new Date(s.scheduledDate) > twoWeeksAgo)
          .map(s => {
            const mid = s.mentorship?.mentor?._id || s.mentorship?.mentor;
            return mid?.toString();
          })
          .filter(Boolean)
      );
      
      const inactiveCount = [...mentorIds].filter(id => !recentSessionMentors.has(id)).length;

      return {
        name: deptName,
        totalMentors: deptMentorships.length,
        activeMentors: deptMentorships.length - inactiveCount,
        inactiveMentors: inactiveCount,
        totalSessions: deptSessions.length,
        verificationRate: Math.round((verifiedCount / totalSessions) * 100)
      };
    }));

    // Sort by verification rate ascending (worst performing first)
    stats.sort((a, b) => a.verificationRate - b.verificationRate);
    
    res.json(stats);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Failed to load analytics' });
  }
});

// GET /api/mentorships?mentor=ID - Get mentor's assigned mentees
app.get('/api/mentorships', protect, async (req, res) => {
  try {
    const query = req.query.mentor 
      ? { mentor: req.query.mentor, status: 'active' }
      : {};
    const mentorships = await Mentorship.find(query).populate('mentee');
    res.json(mentorships);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sessions/mentor/:id - Get all sessions by this mentor
app.get('/api/sessions/mentor/:id', protect, async (req, res) => {
  try {
    const sessions = await Session.find({ 'mentorship.mentor': req.params.id })
      .populate('mentorship.mentee')
      .sort({ scheduledDate: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sessions - Create new session report
app.post('/api/sessions', protect, async (req, res) => {
  try {
    const session = await Session.create(req.body);
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sessions/mentee/:id - Get all sessions for this mentee
// GET /api/sessions/mentee/:id
app.get('/api/sessions/mentee/:id', protect, async (req, res) => {
  try {
    // 1. Find active mentorships for this mentee
    const mentorships = await Mentorship.find({ 
      mentee: req.params.id, 
      status: 'active' 
    });
    
    const mentorshipIds = mentorships.map(m => m._id);
    
    // 2. Fetch sessions AND deeply populate mentor details
    const sessions = await Session.find({ 
      mentorship: { $in: mentorshipIds } 
    })
    .populate({
      path: 'mentorship',       // First populate the mentorship ref
      populate: { 
        path: 'mentor',         // THEN populate the mentor ref inside it
        select: 'name email'    // Only fetch name (security best practice)
      }
    })
    .sort({ scheduledDate: -1 });
      
    res.json(sessions);
  } catch (err) {
    console.error('Mentee sessions error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/feedback - Anonymous feedback submission
app.post('/api/feedback', protect, async (req, res) => {
  try {
    // Intentionally NOT storing req.user._id to preserve anonymity
    const feedback = {
      rating: req.body.rating,
      comment: req.body.comment || '',
      department: req.body.department,
      submittedAt: new Date()
    };
    
    // Save to a separate Feedback collection or append to existing schema
    // For simplicity, assuming a Feedback model exists:
    const Feedback = require('./models/Feedback');
    await Feedback.create(feedback);
    
    res.status(201).json({ message: 'Feedback submitted anonymously' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Example Express Route for updating a user
app.put('/users/:id',protect, async (req, res) => {
  try {
    const { name, role, department, hostel } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { name, role, department, hostel }, 
      { new: true } // Return the updated document
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/google', (req, res, next) => {
  console.log('Redirecting to Google with callback:', "http://localhost:8000/api/auth/google/callback");
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));