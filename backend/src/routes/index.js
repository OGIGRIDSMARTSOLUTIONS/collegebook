const express = require('express');

const authRoutes = require('./auth.routes');
const institutionRoutes = require('./institution.routes');
const studentRoutes = require('./student.routes');
const privacyRoutes = require('./privacy.routes');
const connectionRoutes = require('./connection.routes');
const postRoutes = require('./post.routes');
const messageRoutes = require('./message.routes');
const notificationRoutes = require('./notification.routes');
const broadcastRoutes = require('./broadcast.routes');
const yearbookRoutes = require('./yearbook.routes');
const groupRoutes = require('./group.routes');
const reportRoutes = require('./report.routes');
const savedPostRoutes = require('./savedpost.routes');
const uploadRoutes = require('./upload.routes');
const birthdayRoutes = require('./birthday.routes');
const eventRoutes = require('./event.routes');
const newsFeedRoutes = require('./newsFeed.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/institutions', institutionRoutes);
router.use('/students', studentRoutes);
router.use('/privacy', privacyRoutes);
router.use('/connections', connectionRoutes);
router.use('/posts', postRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/broadcasts', broadcastRoutes);
router.use('/yearbooks', yearbookRoutes);
router.use('/groups', groupRoutes);
router.use('/reports', reportRoutes);
router.use('/saved-posts', savedPostRoutes);
router.use('/uploads', uploadRoutes);
router.use('/birthdays', birthdayRoutes);
router.use('/events', eventRoutes);
router.use('/news-feeds', newsFeedRoutes);

module.exports = router;
