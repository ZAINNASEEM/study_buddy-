// Firebase connected admin dashboard
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ListGroup, Button, Container, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUserGraduate, FaChalkboardTeacher, FaClipboardList, FaExclamationTriangle, FaHome } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp, setDoc, doc, getDoc } from 'firebase/firestore';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        students: 0,
        mentors: 0,
        activeRequests: 0,
        pendingApprovals: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState([]);
    const [seeding, setSeeding] = useState(false);
    const [seedMessage, setSeedMessage] = useState('');

    useEffect(() => {
        setLoading(true);

        // 1. Listen to Students (from users collection)
        const unsubscribeStudents = onSnapshot(query(collection(db, "users"), where("role", "==", "student")), (snapshot) => {
            setStats(prev => ({
                ...prev,
                students: snapshot.size
            }));
        });

        // 2. Listen to Mentors (from mentors collection)
        const unsubscribeMentors = onSnapshot(collection(db, "mentors"), (snapshot) => {
            const mentors = snapshot.docs.map(doc => doc.data());
            const mentorCount = mentors.length;
            const pendingMentors = mentors.filter(m => m.status === 'Pending').length;

            setStats(prev => ({
                ...prev,
                mentors: mentorCount,
                pendingApprovals: pendingMentors
            }));
        });

        // 2. Listen to Requests
        const unsubscribeRequests = onSnapshot(collection(db, "requests"), (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const activeCount = requests.filter(r => r.status === 'Accepted' || r.status === 'Pending').length;

            setStats(prev => ({
                ...prev,
                activeRequests: activeCount
            }));

            // Generate fake activity log from requests for now (or real if timestamp exists)
            const activities = requests
                .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                .slice(0, 3)
                .map(r => ({
                    id: r.id,
                    text: `New request from ${r.studentName || 'Student'} for ${r.subject}`,
                    time: r.timestamp ? new Date(r.timestamp.seconds * 1000).toLocaleTimeString() : 'Just now',
                    type: 'request'
                }));

            setRecentActivity(activities);
            setLoading(false);
        });

        return () => {
            unsubscribeStudents();
            unsubscribeMentors();
            unsubscribeRequests();
        };
    }, []);

    const seedData = async () => {
        setSeeding(true);
        setSeedMessage('');
        try {
            // 1. Migrate existing admins
            const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"));
            const adminsSnap = await getDocs(adminsQuery);
            let migratedCount = 0;

            for (const docSnap of adminsSnap.docs) {
                const adminId = docSnap.id;
                const adminData = docSnap.data();
                const adminRef = doc(db, "admins", adminId);
                const existingAdminRef = await getDoc(adminRef);

                if (!existingAdminRef.exists()) {
                    await setDoc(adminRef, {
                        name: adminData.name || "System Admin",
                        email: adminData.email || "",
                        createdAt: adminData.createdAt || serverTimestamp(),
                        lastLogin: serverTimestamp()
                    });
                    migratedCount++;
                }
            }

            // 2. Migrate existing mentors from 'users' to 'mentors'
            const mentorsInUsersQuery = query(collection(db, "users"), where("role", "==", "mentor"));
            const mentorsInUsersSnap = await getDocs(mentorsInUsersQuery);
            let mentorMigratedCount = 0;

            for (const docSnap of mentorsInUsersSnap.docs) {
                const mentorId = docSnap.id;
                const mentorData = docSnap.data();
                const mentorRef = doc(db, "mentors", mentorId);
                const existingMentorRef = await getDoc(mentorRef);

                if (!existingMentorRef.exists()) {
                    await setDoc(mentorRef, {
                        ...mentorData,
                        name: mentorData.name || "Unknown Mentor",
                        email: mentorData.email || "",
                        status: mentorData.status || (mentorData.isApproved ? 'Active' : 'Pending'),
                        isApproved: mentorData.isApproved !== undefined ? mentorData.isApproved : false,
                        rating: mentorData.rating || 5.0,
                        expertise: mentorData.expertise || (mentorData.subject ? [mentorData.subject] : []),
                        joined: mentorData.joined || (mentorData.createdAt ? new Date(mentorData.createdAt.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                        createdAt: mentorData.createdAt || serverTimestamp()
                    });
                    mentorMigratedCount++;
                }
            }

            // 3. Add Subjects
            const subjectsToAdd = [
                "Mathematics", "Physics", "Chemistry", "Biology",
                "Cybersecurity", "Data Science", "DevOps",
                "Machine Learning", "Artificial Intelligence", "Cloud Computing"
            ];

            for (const sub of subjectsToAdd) {
                const subQuery = query(collection(db, "subjects"), where("name", "==", sub));
                const subSnap = await getDocs(subQuery);
                if (subSnap.empty) {
                    await addDoc(collection(db, "subjects"), { name: sub, createdAt: serverTimestamp() });
                }
            }

            setSeedMessage(`${migratedCount} admins and ${mentorMigratedCount} mentors migrated. Successfully added subjects!`);
        } catch (error) {
            console.error("Error seeding data:", error);
            setSeedMessage('Error seeding data: ' + error.message);
        } finally {
            setSeeding(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="admin">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <Container fluid className="px-0">
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <div>
                        <h2 className="fw-bold mb-1" style={{ color: '#2c3e50' }}>Admin Overview</h2>
                        <p className="text-muted mb-0">Welcome back, Admin. Real-time platform statistics.</p>
                    </div>
                    <div className="d-flex gap-2">
                        <Button
                            variant="outline-info"
                            size="sm"
                            className="rounded-pill px-3"
                            onClick={seedData}
                            disabled={seeding}
                        >
                            {seeding ? <Spinner size="sm" /> : "Seed Sample Data"}
                        </Button>
                        <Link to="/">
                            <Button variant="outline-dark" className="d-flex align-items-center gap-2 shadow-sm rounded-pill px-4">
                                <FaHome /> Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>

                {seedMessage && (
                    <Alert variant={seedMessage.includes('Error') ? 'danger' : 'success'} dismissible onClose={() => setSeedMessage('')} className="mb-4">
                        {seedMessage}
                    </Alert>
                )}

                {/* Stats Row */}
                <Row className="mb-5 g-4">
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100 overflow-hidden" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}>
                            <Card.Body className="position-relative p-4">
                                <div className="d-flex justify-content-between align-items-start mb-4">
                                    <div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary">
                                        <FaUserGraduate size={24} />
                                    </div>
                                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1">Live</span>
                                </div>
                                <h3 className="fw-bold mb-1">{stats.students}</h3>
                                <p className="text-muted small mb-0 fw-medium">Total Students</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100 overflow-hidden" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}>
                            <Card.Body className="position-relative p-4">
                                <div className="d-flex justify-content-between align-items-start mb-4">
                                    <div className="p-3 rounded-circle bg-success bg-opacity-10 text-success">
                                        <FaChalkboardTeacher size={24} />
                                    </div>
                                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1">Live</span>
                                </div>
                                <h3 className="fw-bold mb-1">{stats.mentors}</h3>
                                <p className="text-muted small mb-0 fw-medium">Total Mentors</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100 overflow-hidden" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}>
                            <Card.Body className="position-relative p-4">
                                <div className="d-flex justify-content-between align-items-start mb-4">
                                    <div className="p-3 rounded-circle bg-info bg-opacity-10 text-info">
                                        <FaClipboardList size={24} />
                                    </div>
                                    <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-1">Action Needed</span>
                                </div>
                                <h3 className="fw-bold mb-1">{stats.activeRequests}</h3>
                                <p className="text-muted small mb-0 fw-medium">Active Requests</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm h-100 overflow-hidden" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}>
                            <Card.Body className="position-relative p-4">
                                <div className="d-flex justify-content-between align-items-start mb-4">
                                    <div className="p-3 rounded-circle bg-warning bg-opacity-10 text-warning">
                                        <FaExclamationTriangle size={24} />
                                    </div>
                                    <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-1">High Priority</span>
                                </div>
                                <h3 className="fw-bold mb-1">{stats.pendingApprovals}</h3>
                                <p className="text-muted small mb-0 fw-medium">Pending Approvals</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    {/* System Health / Recent Activity */}
                    <Col md={12}>
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                            <Card.Header className="bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Recent System Activity</h5>
                                <Button variant="link" className="text-decoration-none text-muted small p-0">View All</Button>
                            </Card.Header>
                            <ListGroup variant="flush">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map(activity => (
                                        <ListGroup.Item key={activity.id} className="border-0 px-4 py-3 d-flex align-items-center hover-bg-light">
                                            <div className="p-2 rounded-circle bg-info bg-opacity-10 text-info me-3">
                                                <FaClipboardList />
                                            </div>
                                            <div className="flex-grow-1">
                                                <p className="mb-0 fw-medium">{activity.text}</p>
                                                <small className="text-muted">{activity.time}</small>
                                            </div>
                                        </ListGroup.Item>
                                    ))
                                ) : (
                                    <ListGroup.Item className="border-0 px-4 py-3 text-center text-muted">
                                        No recent activity found.
                                    </ListGroup.Item>
                                )}
                            </ListGroup>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </DashboardLayout>
    );
};

export default AdminDashboard;
