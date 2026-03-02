import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const RequestDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const docRef = doc(db, "requests", id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setRequest({ id: docSnap.id, ...docSnap.data() });
                    } else {
                        setMessage({ type: 'danger', text: 'Request not found.' });
                    }
                } catch (error) {
                    console.error("Error fetching request:", error);
                    setMessage({ type: 'danger', text: 'Failed to load request details.' });
                } finally {
                    setLoading(false);
                }
            } else {
                navigate('/mentor/login');
            }
        });
        return () => unsubscribe();
    }, [id, navigate]);

    const handleAction = async (status) => {
        if (status === 'Rejected' && !window.confirm("Are you sure you want to decline this request?")) return;

        setActionLoading(true);
        try {
            const updates = { status };
            if (status === 'Accepted') {
                updates.meetingId = `session-${Math.random().toString(36).substring(2, 9)}`;
            }

            await updateDoc(doc(db, "requests", id), updates);
            setRequest(prev => ({ ...prev, ...updates }));
            setMessage({ type: 'success', text: `Request ${status.toLowerCase()} successfully!` });
        } catch (error) {
            console.error(`Error ${status} request:`, error);
            setMessage({ type: 'danger', text: `Failed to ${status.toLowerCase()} request.` });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="mentor">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!request) {
        return (
            <DashboardLayout role="mentor">
                <div className="text-center py-5">
                    <Alert variant="danger">Request not found.</Alert>
                    <Button as={Link} to="/mentor/requests" variant="primary">Back to Requests</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="mentor">
            <Row className="justify-content-center text-dark">
                <Col md={8}>
                    {message.text && <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>{message.text}</Alert>}
                    <Card className="shadow border-0 rounded-3">
                        <Card.Header className="bg-white p-4 d-flex justify-content-between align-items-center">
                            <h4 className="fw-bold mb-0">Request Details</h4>
                            <Badge
                                bg={request.status === 'Accepted' ? 'success' : request.status === 'Rejected' ? 'danger' : 'warning'}
                                text={request.status === 'Pending' ? 'dark' : 'white'}
                                className="fs-6"
                            >
                                {request.status}
                            </Badge>
                        </Card.Header>
                        <Card.Body className="p-4 p-md-5">
                            <Row className="mb-4">
                                <Col md={6} className="mb-3 mb-md-0">
                                    <h6 className="text-muted text-uppercase small fw-bold">Student</h6>
                                    <p className="fw-bold fs-5 mb-0">{request.studentName}</p>
                                </Col>
                                <Col md={6}>
                                    <h6 className="text-muted text-uppercase small fw-bold">Subject</h6>
                                    <p className="fw-bold fs-5 mb-0">{request.subject}</p>
                                </Col>
                            </Row>

                            <div className="mb-4">
                                <h6 className="text-muted text-uppercase small fw-bold">Topic / Description</h6>
                                <p className="lead fs-6">{request.topic || "No description provided."}</p>
                            </div>

                            <Row className="mb-4 bg-light p-3 rounded">
                                <Col md={4} className="mb-2 mb-md-0">
                                    <small className="text-muted d-block fw-bold">Date</small>
                                    <div className="fw-bold">{request.timestamp ? new Date(request.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}</div>
                                </Col>
                                <Col md={4} className="mb-2 mb-md-0">
                                    <small className="text-muted d-block fw-bold">Time</small>
                                    <div className="fw-bold">{request.timestamp ? new Date(request.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                                </Col>
                                <Col md={4}>
                                    <small className="text-muted d-block fw-bold">Status</small>
                                    <div className="fw-bold">{request.status}</div>
                                </Col>
                            </Row>

                            <div className="d-flex flex-wrap gap-2 justify-content-end mt-4">
                                <Button as={Link} to="/mentor/requests" variant="outline-secondary">Back</Button>
                                {request.status === 'Pending' && (
                                    <>
                                        <Button
                                            variant="danger"
                                            onClick={() => handleAction('Rejected')}
                                            disabled={actionLoading}
                                        >
                                            Decline Request
                                        </Button>
                                        <Button
                                            variant="success"
                                            onClick={() => handleAction('Accepted')}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? <Spinner size="sm" /> : 'Accept & Schedule'}
                                        </Button>
                                    </>
                                )}
                                {request.status === 'Accepted' && request.meetingId && (
                                    <Button as={Link} to={`/video/${request.meetingId}`} variant="primary">
                                        Join Session
                                    </Button>
                                )}
                                <Button as={Link} to={`/mentor/chat/${request.studentId}`} variant="info" className="text-white">
                                    Chat with Student
                                </Button>
                            </div>

                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </DashboardLayout>
    );
};

export default RequestDetails;
