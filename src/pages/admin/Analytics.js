import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ProgressBar, Spinner, Badge } from 'react-bootstrap';
import { FaChartBar, FaChartPie, FaUsers, FaBookOpen } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const Analytics = () => {
    const [stats, setStats] = useState({
        students: 0,
        mentors: 0,
        subjectsCount: 0,
        requestsBySubject: {},
        totalRequests: 0,
        loading: true
    });

    useEffect(() => {
        const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const users = snapshot.docs.map(doc => doc.data());
            const studentCount = users.filter(u => u.role === 'student').length;
            const mentorCount = users.filter(u => u.role === 'mentor').length;
            setStats(prev => ({ ...prev, students: studentCount, mentors: mentorCount }));
        });

        const unsubscribeSubjects = onSnapshot(collection(db, "subjects"), (snapshot) => {
            setStats(prev => ({ ...prev, subjectsCount: snapshot.size }));
        });

        const unsubscribeRequests = onSnapshot(collection(db, "requests"), (snapshot) => {
            const requests = snapshot.docs.map(doc => doc.data());
            const subDist = {};
            requests.forEach(r => {
                const sub = r.subject || 'Other';
                subDist[sub] = (subDist[sub] || 0) + 1;
            });
            setStats(prev => ({
                ...prev,
                totalRequests: requests.length,
                requestsBySubject: subDist,
                loading: false
            }));
        });

        return () => {
            unsubscribeUsers();
            unsubscribeSubjects();
            unsubscribeRequests();
        };
    }, []);

    if (stats.loading) {
        return (
            <DashboardLayout role="admin">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            </DashboardLayout>
        );
    }

    const sortedSubjects = Object.entries(stats.requestsBySubject)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return (
        <DashboardLayout role="admin">
            <h2 className="fw-bold mb-5">Platform Analytics</h2>

            <Row className="mb-5">
                <Col md={6} className="mb-4">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-white fw-bold"><FaChartBar /> Top Subjects (by Requests)</Card.Header>
                        <Card.Body>
                            {sortedSubjects.length > 0 ? (
                                sortedSubjects.map(([subject, count]) => (
                                    <div className="mb-3" key={subject}>
                                        <div className="d-flex justify-content-between mb-1">
                                            <span>{subject}</span>
                                            <span>{stats.totalRequests > 0 ? Math.round((count / stats.totalRequests) * 100) : 0}%</span>
                                        </div>
                                        <ProgressBar now={stats.totalRequests > 0 ? (count / stats.totalRequests) * 100 : 0} variant="primary" />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-5 text-muted">No request data found.</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} className="mb-4">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-white fw-bold"><FaChartPie /> User Distribution</Card.Header>
                        <Card.Body className="text-center d-flex align-items-center justify-content-center flex-column">
                            <div className="rounded-circle border border-5 border-primary bg-light d-flex align-items-center justify-content-center mb-3 shadow-inner" style={{ width: '150px', height: '150px' }}>
                                <h3 className="fw-bold mb-0">{stats.students + stats.mentors}</h3>
                            </div>
                            <p className="fw-bold text-muted">Total Active Users</p>
                            <div className="d-flex gap-4">
                                <div className="text-center">
                                    <FaUsers className="text-primary mb-2" size={24} />
                                    <h5 className="mb-0">{stats.students}</h5>
                                    <small className="text-muted">Students</small>
                                </div>
                                <div className="text-center">
                                    <FaBookOpen className="text-success mb-2" size={24} />
                                    <h5 className="mb-0">{stats.mentors}</h5>
                                    <small className="text-muted">Mentors</small>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-top w-100">
                                <Badge bg="info" className="p-2">Total Subjects: {stats.subjectsCount}</Badge>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </DashboardLayout>
    );
};

export default Analytics;

