import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaCheck, FaTimes, FaUser } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { db } from '../../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const MentorApproval = () => {
    const [pendingMentors, setPendingMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        // We use two separate listeners or just fetch all and filter client side for better robustness
        const q = query(collection(db, "mentors"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const mentors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Filter client-side to handle case sensitivity and potentially missing status field
            const pending = mentors.filter(m => (m.status || '').toLowerCase() === 'pending');
            setPendingMentors(pending);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching mentors for approval:", err);
            setError("Failed to load mentor applications.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (id) => {
        setActionLoading(id);
        try {
            // Update in mentors collection (Primary)
            await updateDoc(doc(db, "mentors", id), {
                status: 'Active',
                isApproved: true,
                approvedAt: serverTimestamp()
            });

            // Also update in users collection for consistency if status field exists there
            try {
                const userDoc = await getDoc(doc(db, "users", id));
                if (userDoc.exists()) {
                    await updateDoc(doc(db, "users", id), {
                        status: 'Active',
                        isApproved: true,
                        role: 'mentor' // Ensure role is correct
                    });
                }
            } catch (userErr) {
                console.warn("Could not update status in users collection:", userErr);
            }
        } catch (err) {
            console.error("Error approving mentor:", err);
            alert("Failed to approve mentor: " + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Are you sure you want to reject this application? This will remove the mentor profile.")) return;
        setActionLoading(id);
        try {
            // Delete from mentors collection
            await deleteDoc(doc(db, "mentors", id));

            // Optional: check if user exists before update
            const userRef = doc(db, "users", id);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                await updateDoc(userRef, {
                    role: 'student',
                    status: 'Rejected'
                });
            }
        } catch (err) {
            console.error("Error rejecting mentor:", err);
            alert("Failed to reject mentor: " + err.message);
        } finally {
            setActionLoading(null);
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
            <h2 className="fw-bold mb-4" style={{ color: '#2c3e50' }}>Pending Mentor Approvals</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="shadow-sm border-0" style={{ borderRadius: '15px' }}>
                <Card.Body className="p-0">
                    <Table responsive hover className="align-middle mb-0">
                        <thead className="bg-light text-secondary">
                            <tr>
                                <th className="ps-4">Name</th>
                                <th>Email</th>
                                <th>Expertise</th>
                                <th>Applied Date</th>
                                <th className="pe-4 text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingMentors.length > 0 ? (
                                pendingMentors.map((mentor) => (
                                    <tr key={mentor.id}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-primary bg-opacity-10 text-primary rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <span className="fw-bold">{(mentor.name || mentor.firstName || 'M').charAt(0)}</span>
                                                </div>
                                                <div className="fw-bold text-dark">{mentor.name || (mentor.firstName ? `${mentor.firstName} ${mentor.lastName || ''}` : 'Unknown')}</div>
                                            </div>
                                        </td>
                                        <td>{mentor.email || 'N/A'}</td>
                                        <td>
                                            {Array.isArray(mentor.expertise) ?
                                                mentor.expertise.map((exp, i) => <Badge key={i} bg="info" className="me-1 bg-opacity-10 text-info font-weight-normal border border-info border-opacity-25">{exp}</Badge>) :
                                                <Badge bg="info" className="bg-opacity-10 text-info font-weight-normal border border-info border-opacity-25">{mentor.subject || mentor.expertise || 'N/A'}</Badge>
                                            }
                                        </td>
                                        <td>{mentor.joined || (mentor.createdAt ? new Date(mentor.createdAt.seconds * 1000).toLocaleDateString() : 'N/A')}</td>
                                        <td className="pe-4 text-end">
                                            <Button
                                                variant="success"
                                                size="sm"
                                                className="me-2 rounded-pill px-3 shadow-sm border-0 d-inline-flex align-items-center gap-1"
                                                onClick={() => handleApprove(mentor.id)}
                                                disabled={actionLoading === mentor.id}
                                            >
                                                {actionLoading === mentor.id ? <Spinner size="sm" /> : <><FaCheck size={12} /> Approve</>}
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                className="rounded-pill px-3 d-inline-flex align-items-center gap-1"
                                                onClick={() => handleReject(mentor.id)}
                                                disabled={actionLoading === mentor.id}
                                            >
                                                <FaTimes size={12} /> Reject
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-5 text-muted">
                                        <div className="py-4">
                                            <FaUser size={40} className="mb-3 opacity-25" />
                                            <p className="mb-0">No pending approvals found at the moment.</p>
                                        </div>
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

export default MentorApproval;

