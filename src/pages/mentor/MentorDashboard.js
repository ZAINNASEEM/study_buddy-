import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ListGroup, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUserGraduate, FaCalendarCheck, FaClock, FaStar, FaBell } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const MentorDashboard = () => {
    const [stats, setStats] = useState({
        pending: 0,
        upcoming: 0,
        hours: 0,
        rating: 4.9 // Placeholder until reviews are implemented
    });
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // Subscribe to requests for this mentor
                const q = query(
                    collection(db, "requests"),
                    where("mentorId", "==", currentUser.uid)
                );

                const unsubscribeRequests = onSnapshot(q, (snapshot) => {
                    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    // Calculate stats
                    const pendingCount = requests.filter(r => r.status === 'Pending').length;
                    const upcomingCount = requests.filter(r => r.status === 'Accepted' || r.status === 'Scheduled').length;

                    setStats(prev => ({
                        ...prev,
                        pending: pendingCount,
                        upcoming: upcomingCount
                    }));

                    // Generate notifications from recent requests
                    const recentRequests = requests
                        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                        .slice(0, 5);

                    setNotifications(recentRequests);
                    setLoading(false);
                });

                return () => unsubscribeRequests();
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    if (loading) {
        return (
            <DashboardLayout role="mentor">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="mentor">
            <h2 className="fw-bold mb-4">Mentor Dashboard</h2>

            {/* Stats Row */}
            <Row className="mb-4 g-3">
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-primary text-white h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <FaUserGraduate size={30} />
                                <span className="h4 fw-bold mb-0">{stats.pending}</span>
                            </div>
                            <Card.Text>Pending Requests</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-success text-white h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <FaCalendarCheck size={30} />
                                <span className="h4 fw-bold mb-0">{stats.upcoming}</span>
                            </div>
                            <Card.Text>Upcoming Sessions</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-info text-dark h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <FaClock size={30} />
                                <span className="h4 fw-bold mb-0">{stats.hours}h</span>
                            </div>
                            <Card.Text>Hours Taught</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-warning text-dark h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <FaStar size={30} />
                                <span className="h4 fw-bold mb-0">{stats.rating}</span>
                            </div>
                            <Card.Text>Average Rating</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                {/* Recent Notifications */}
                <Col md={12}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-white fw-bold"><FaBell className="me-2 text-primary" /> Notifications</Card.Header>
                        <ListGroup variant="flush">
                            {notifications.length > 0 ? (
                                notifications.map(req => (
                                    <ListGroup.Item key={req.id}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{req.studentName}</strong> has requested a session on <em>{req.subject}</em>.
                                                <div className="text-muted small">
                                                    {req.timestamp ? new Date(req.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                                                </div>
                                            </div>
                                            <Link to={`/mentor/request/${req.id}`} className="btn btn-sm btn-outline-primary">View</Link>
                                        </div>
                                    </ListGroup.Item>
                                ))
                            ) : (
                                <ListGroup.Item className="text-center text-muted py-4">
                                    No new notifications.
                                </ListGroup.Item>
                            )}
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </DashboardLayout>
    );
};

export default MentorDashboard;
