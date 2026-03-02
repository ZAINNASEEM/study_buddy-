import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';

const MentorSettings = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        experience: '',
        education: '',
        location: '',
        availability: '',
        subject: ''
    });

    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const docRef = doc(db, "mentors", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFormData(prev => ({ ...prev, ...docSnap.data() }));
                } else {
                    // Fallback to 'users' if not in 'mentors' (during migration)
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setFormData(prev => ({ ...prev, ...userSnap.data() }));
                    }
                }
                setLoading(false);
            } else {
                navigate('/mentor/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const docRef = doc(db, "mentors", user.uid);
            await setDoc(docRef, formData, { merge: true });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: 'danger', text: 'Failed to update profile: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return setMessage({ type: 'danger', text: 'Passwords do not match' });
        }
        setSaving(true);
        try {
            await updatePassword(auth.currentUser, passwords.newPassword);
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setPasswords({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage({ type: 'danger', text: 'Failed to update password. You may need to re-login.' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="mentor">
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="mentor">
            <Row className="justify-content-center">
                <Col lg={10}>
                    <h2 className="fw-bold mb-4 text-dark">Settings</h2>

                    {message.text && (
                        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                            {message.text}
                        </Alert>
                    )}

                    <Row className="g-4">
                        <Col md={8}>
                            <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '15px' }}>
                                <Card.Header className="bg-white fw-bold py-3 border-0">Profile Information</Card.Header>
                                <Card.Body className="p-4">
                                    <Form onSubmit={handleProfileUpdate}>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Full Name</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Expert Subject</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={formData.subject}
                                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Location</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. London, UK (Remote)"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Bio (Brief tagline)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Short professional tagline..."
                                                value={formData.bio}
                                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>About / Detailed Professional Summary</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={4}
                                                value={formData.about || formData.bio}
                                                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                                            />
                                        </Form.Group>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Experience</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        placeholder="List your professional history..."
                                                        value={formData.experience}
                                                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Education</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        placeholder="List your academic qualifications..."
                                                        value={formData.education}
                                                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-4">
                                            <Form.Label>Availability</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. Mon-Fri: 6 PM - 9 PM"
                                                value={formData.availability}
                                                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                                            />
                                        </Form.Group>

                                        <Button variant="primary" type="submit" className="px-4 rounded-pill" disabled={saving}>
                                            {saving ? <Spinner size="sm" /> : 'Save Profile Changes'}
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '15px' }}>
                                <Card.Header className="bg-white fw-bold py-3 border-0">Security</Card.Header>
                                <Card.Body className="p-4">
                                    <Form onSubmit={handlePasswordUpdate}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>New Password</Form.Label>
                                            <Form.Control
                                                type="password"
                                                value={passwords.newPassword}
                                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-4">
                                            <Form.Label>Confirm New Password</Form.Label>
                                            <Form.Control
                                                type="password"
                                                value={passwords.confirmPassword}
                                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            />
                                        </Form.Group>
                                        <Button variant="outline-primary" type="submit" className="w-100 rounded-pill mb-3" disabled={saving}>
                                            {saving ? <Spinner size="sm" /> : 'Update Password'}
                                        </Button>
                                    </Form>

                                    <hr className="my-4" />

                                    <Button variant="danger" className="w-100 rounded-pill py-2 shadow-sm" onClick={handleLogout}>
                                        Log Out
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </DashboardLayout>
    );
};

export default MentorSettings;

