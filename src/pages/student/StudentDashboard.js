import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch, FaList, FaUser, FaBell } from 'react-icons/fa';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const StudentDashboard = () => {
    const [stats, setStats] = useState({
        completed: 0,
        hours: 0,
        active: 0
    });
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Query requests for this student
                const q = query(
                    collection(db, "requests"),
                    where("studentId", "==", currentUser.uid)
                );

                const unsubscribeRequests = onSnapshot(q, (snapshot) => {
                    const requests = snapshot.docs.map(doc => doc.data());

                    const activeCount = requests.filter(r => r.status === 'Pending' || r.status === 'Accepted').length;
                    const completedCount = requests.filter(r => r.status === 'Completed').length;
                    // Placeholder for hours calculation
                    const hoursCount = completedCount * 1.5;

                    setStats({
                        completed: completedCount,
                        hours: hoursCount,
                        active: activeCount
                    });

                    // Notifications: accepted requests or status changes
                    // Ideally this would come from a separate 'notifications' collection, 
                    // but we can simulate it from request updates for now.
                    const recentUpdates = requests
                        .filter(r => r.status !== 'Pending')
                        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                        .slice(0, 5)
                        .map(r => ({
                            id: r.id,
                            message: `Request for ${r.subject} is now ${r.status}`,
                            status: r.status,
                            time: r.timestamp ? new Date(r.timestamp.seconds * 1000).toLocaleString() : 'Recently'
                        }));

                    setNotifications(recentUpdates);
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
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <Container className="py-5">
            <Row className="mb-4">
                <Col>
                    <h2 className="fw-bold">Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!</h2>
                    <p className="text-muted">What would you like to learn today?</p>
                </Col>
            </Row>

            {/* Quick Actions */}
            <Row className="mb-5 g-4">
                <Col md={3}>
                    <Card className="h-100 shadow-sm border-0 text-center p-3 action-card">
                        <Card.Body>
                            <div className="text-primary mb-3"><FaPlus size={40} /></div>
                            <Card.Title>Create Request</Card.Title>
                            <Link to="/student/create-request" className="stretched-link"></Link>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100 shadow-sm border-0 text-center p-3 action-card">
                        <Card.Body>
                            <div className="text-success mb-3"><FaSearch size={40} /></div>
                            <Card.Title>Find Mentors</Card.Title>
                            <Link to="/student/search-mentors" className="stretched-link"></Link>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100 shadow-sm border-0 text-center p-3 action-card">
                        <Card.Body>
                            <div className="text-info mb-3"><FaList size={40} /></div>
                            <Card.Title>My Requests</Card.Title>
                            <Link to="/student/requests" className="stretched-link"></Link>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100 shadow-sm border-0 text-center p-3 action-card">
                        <Card.Body>
                            <div className="text-warning mb-3"><FaUser size={40} /></div>
                            <Card.Title>My Profile</Card.Title>
                            <Link to="/student/profile" className="stretched-link"></Link>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                {/* Notifications / Stats */}
                <Col md={8}>
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Header className="bg-white fw-bold border-bottom-0 pt-3">
                            <FaBell className="me-2 text-primary" /> Recent Updates
                        </Card.Header>
                        <ListGroup variant="flush">
                            {notifications.length > 0 ? (
                                notifications.map((notif, idx) => (
                                    <ListGroup.Item key={idx}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                {notif.message}
                                                <div className="text-muted small">{notif.time}</div>
                                            </div>
                                            <Badge bg={notif.status === 'Accepted' ? 'success' : 'info'}>{notif.status}</Badge>
                                        </div>
                                    </ListGroup.Item>
                                ))
                            ) : (
                                <ListGroup.Item className="text-center text-muted">No recent updates.</ListGroup.Item>
                            )}
                        </ListGroup>
                    </Card>
                </Col>

                {/* Stats Sidebar */}
                <Col md={4}>
                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Your Journey</h5>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Sessions Completed</span>
                                <span className="fw-bold">{stats.completed}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Hours Learned</span>
                                <span className="fw-bold">{stats.hours}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>Active Requests</span>
                                <span className="fw-bold text-primary">{stats.active}</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default StudentDashboard;
