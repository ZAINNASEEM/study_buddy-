import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const AdminSettings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const docRef = doc(db, "admins", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setFormData({
                            name: docSnap.data().name || '',
                            email: docSnap.data().email || ''
                        });
                    } else {
                        // Fallback to 'users' if not in 'admins'
                        const userRef = doc(db, "users", currentUser.uid);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            setFormData({
                                name: userSnap.data().name || '',
                                email: userSnap.data().email || ''
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error fetching admin profile:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                navigate('/admin/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await setDoc(doc(db, "admins", user.uid), {
                ...formData,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setMessage({ type: 'success', text: 'Admin profile updated!' });
        } catch (error) {
            console.error("Error updating admin profile:", error);
            setMessage({ type: 'danger', text: 'Failed to update: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };


    if (loading) {
        return (
            <DashboardLayout role="admin">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                    <Spinner animation="border" variant="danger" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <Row className="justify-content-center">
                <Col md={10} lg={8}>
                    {message.text && <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>{message.text}</Alert>}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Header className="bg-danger text-white fw-bold py-3">Admin Profile Settings</Card.Header>
                        <Card.Body className="p-4">
                            <Form onSubmit={handleProfileUpdate}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold">Display Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold">Contact Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <div className="text-end">
                                    <Button variant="danger" type="submit" disabled={saving}>
                                        {saving ? <Spinner size="sm" className="me-2" /> : null}
                                        Update Admin Info
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-dark text-white fw-bold py-3">Platform Operations</Card.Header>
                        <Card.Body className="p-4">
                            <Form>
                                <h5 className="mb-3">General Configuration</h5>
                                <Form.Group className="mb-3">
                                    <Form.Label>Platform Name</Form.Label>
                                    <Form.Control type="text" defaultValue="Study-Buddy" />
                                </Form.Group>
                                <Form.Check type="switch" label="Enable New User Registration" defaultChecked className="mb-3" />
                                <Form.Check type="switch" label="Maintenance Mode" className="mb-3" />

                                <hr className="my-4" />

                                <Button variant="outline-danger" className="w-100 py-2 fw-bold" onClick={handleLogout}>Admin Logout</Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </DashboardLayout>
    );
};

export default AdminSettings;
