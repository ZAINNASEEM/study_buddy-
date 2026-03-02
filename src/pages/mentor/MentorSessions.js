import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const MentorSessions = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // Fetch accepted/completed sessions
                const q = query(
                    collection(db, "requests"),
                    where("mentorId", "==", currentUser.uid),
                    where("status", "in", ["Accepted", "Completed"])
                );

                const unsubscribeSessions = onSnapshot(q, (snapshot) => {
                    const sess = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    sess.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
                    setSessions(sess);
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching sessions:", error);
                    setLoading(false);
                });

                return () => unsubscribeSessions();
            } else {
                navigate('/mentor/login');
            }
        });

        return () => unsubscribeAuth();
    }, [navigate]);

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
            <h2 className="fw-bold mb-4">My Sessions</h2>

            <Card className="shadow-sm border-0 text-dark">
                <Card.Body>
                    <Table responsive hover className="align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th>Student</th>
                                <th>Subject</th>
                                <th>Topic</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.length > 0 ? (
                                sessions.map((session) => (
                                    <tr key={session.id}>
                                        <td className="fw-bold">{session.studentName}</td>
                                        <td>{session.subject}</td>
                                        <td>{session.topic}</td>
                                        <td>
                                            {session.timestamp ? new Date(session.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}
                                            <br />
                                            <small className="text-muted">
                                                {session.timestamp ? new Date(session.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </small>
                                        </td>
                                        <td>
                                            {session.status === 'Completed' && <Badge bg="success">Completed</Badge>}
                                            {session.status === 'Accepted' && <Badge bg="primary">Scheduled</Badge>}
                                        </td>
                                        <td>
                                            {session.status === 'Accepted' && session.meetingId && (
                                                <Button as={Link} to={`/video/${session.meetingId}`} variant="outline-primary" size="sm">
                                                    Start Meeting
                                                </Button>
                                            )}
                                            {session.status === 'Completed' && (
                                                <Button variant="outline-secondary" size="sm" disabled>
                                                    View Report
                                                </Button>
                                            )}
                                            <Button as={Link} to={`/mentor/request/${session.id}`} variant="link" size="sm" className="ms-2">
                                                Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-5 text-muted">
                                        No sessions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </DashboardLayout>
    );
};

export default MentorSessions;
