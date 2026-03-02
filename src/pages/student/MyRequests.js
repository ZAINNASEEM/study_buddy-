import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEye, FaTimes } from 'react-icons/fa';

import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const MyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                const q = query(
                    collection(db, "requests"),
                    where("studentId", "==", currentUser.uid)
                );

                const unsubscribeRequests = onSnapshot(q, (snapshot) => {
                    const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Sort by newest first
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

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to cancel this request?")) {
            try {
                await deleteDoc(doc(db, "requests", id));
            } catch (error) {
                console.error("Error cancelling request:", error);
                alert("Failed to cancel request");
            }
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <Container className="py-5">
            <h2 className="fw-bold mb-4">My Study Requests</h2>

            <Card className="shadow-sm border-0">
                <Card.Body>
                    <Table responsive hover className="align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th>Subject</th>
                                <th>Topic</th>
                                <th>Mentor</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length > 0 ? (
                                requests.map((req) => (
                                    <tr key={req.id}>
                                        <td className="fw-bold">{req.subject}</td>
                                        <td>{req.topic}</td>
                                        <td>{req.mentorName || '-'}</td>
                                        <td>{req.timestamp ? new Date(req.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                            {req.status === 'Accepted' && <Badge bg="success">Accepted</Badge>}
                                            {req.status === 'Pending' && <Badge bg="warning" text="dark">Pending</Badge>}
                                            {req.status === 'Completed' && <Badge bg="secondary">Completed</Badge>}
                                            {req.status === 'Rejected' && <Badge bg="danger">Rejected</Badge>}
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button variant="outline-primary" size="sm"><FaEye /></Button>
                                                {req.status === 'Accepted' && req.meetingId && (
                                                    <Button as={Link} to={`/video/${req.meetingId}`} variant="primary" size="sm">
                                                        Join Session
                                                    </Button>
                                                )}
                                                {req.status === 'Pending' && (
                                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(req.id)}>
                                                        <FaTimes />
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
        </Container>
    );
};

export default MyRequests;
