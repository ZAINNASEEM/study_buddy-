import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEye, FaCheck, FaTimes, FaCommentDots } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const StudentRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                const q = query(
                    collection(db, "requests"),
                    where("mentorId", "==", currentUser.uid)
                );

                const unsubscribeRequests = onSnapshot(q, (snapshot) => {
                    const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    reqs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
                    setRequests(reqs);
                    setLoading(false);
                });

                return () => unsubscribeRequests();
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const handleAccept = async (id) => {
        try {
            const meetingId = `session-${Math.random().toString(36).substring(2, 9)}`;
            await updateDoc(doc(db, "requests", id), {
                status: "Accepted",
                meetingId: meetingId
            });
        } catch (error) {
            console.error("Error accepting request:", error);
            alert("Failed to accept request");
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Are you sure you want to reject this request?")) return;
        try {
            await updateDoc(doc(db, "requests", id), {
                status: "Rejected"
            });
        } catch (error) {
            console.error("Error rejecting request:", error);
            alert("Failed to reject request");
        }
    };

    const filteredRequests = filterStatus === 'All'
        ? requests
        : requests.filter(req => req.status === filterStatus);

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
            <Row className="mb-4 align-items-center">
                <Col>
                    <h2 className="fw-bold">Student Requests</h2>
                </Col>
                <Col md={3}>
                    <Form.Select size="sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="All">All Requests</option>
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                    </Form.Select>
                </Col>
            </Row>

            <Card className="shadow-sm border-0">
                <Card.Body>
                    <Table responsive hover className="align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th>Student</th>
                                <th>Subject</th>
                                <th>Topic</th>
                                <th>Requested Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length > 0 ? (
                                filteredRequests.map((req) => (
                                    <tr key={req.id}>
                                        <td className="fw-bold">{req.studentName}</td>
                                        <td>{req.subject}</td>
                                        <td>{req.topic}</td>
                                        <td>{req.timestamp ? new Date(req.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                            {req.status === 'Accepted' && <Badge bg="success">Accepted</Badge>}
                                            {req.status === 'Pending' && <Badge bg="warning" text="dark">Pending</Badge>}
                                            {req.status === 'Rejected' && <Badge bg="danger">Rejected</Badge>}
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button as={Link} to={`/mentor/request/${req.id}`} variant="outline-primary" size="sm" title="View Details"><FaEye /></Button>
                                                <Button as={Link} to={`/mentor/chat/${req.studentId}`} variant="outline-info" size="sm" title="Message Student"><FaCommentDots /></Button>
                                                {req.status === 'Pending' && (
                                                    <>
                                                        <Button variant="success" size="sm" onClick={() => handleAccept(req.id)}><FaCheck /></Button>
                                                        <Button variant="danger" size="sm" onClick={() => handleReject(req.id)}><FaTimes /></Button>
                                                    </>
                                                )}
                                                {req.status === 'Accepted' && req.meetingId && (
                                                    <Button as={Link} to={`/video/${req.meetingId}`} variant="primary" size="sm">
                                                        Join Session
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-5 text-muted">
                                        No requests found.
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

export default StudentRequests;
