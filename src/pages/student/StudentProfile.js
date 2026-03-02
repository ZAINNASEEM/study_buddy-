import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';

const StudentProfile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [profile, setProfile] = useState({
        name: '',
        phone: '',
        location: '',
        email: ''
    });

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const docSnap = await getDoc(doc(db, "users", currentUser.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProfile({
                        name: data.name || '',
                        phone: data.phone || '',
                        location: data.location || '',
                        email: data.email || currentUser.email
                    });
                }
                setLoading(false);
            } else {
                navigate('/student/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await updateDoc(doc(db, "users", user.uid), {
                name: profile.name,
                phone: profile.phone,
                location: profile.location,
                updatedAt: serverTimestamp()
            });
            setSuccess('Profile updated successfully!');
        } catch (err) {
            console.error("Error updating profile:", err);
            setError('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setError('New passwords do not match.');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await updatePassword(auth.currentUser, passwords.new);
            setSuccess('Password updated successfully!');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err) {
            console.error("Error updating password:", err);
            setError('Failed to update password. You may need to re-login for this action.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (err) {
            console.error("Error signing out:", err);
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
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="shadow border-0">
                        <Card.Header className="bg-white p-4 pb-0 border-bottom-0">
                            <h3 className="fw-bold">My Profile Settings</h3>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
                            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

                            <Tabs defaultActiveKey="personal" id="profile-tabs" className="mb-4">
                                <Tab eventKey="personal" title="Personal Info">
                                    <Form onSubmit={handleSaveProfile}>
                                        <Form.Group className="mb-3" controlId="fullName">
                                            <Form.Label>Full Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3" controlId="email">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control type="email" value={profile.email} disabled />
                                        </Form.Group>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group controlId="phone">
                                                    <Form.Label>Phone</Form.Label>
                                                    <Form.Control
                                                        type="tel"
                                                        value={profile.phone}
                                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group controlId="location">
                                                    <Form.Label>Location</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={profile.location}
                                                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <div className="text-end">
                                            <Button variant="primary" type="submit" disabled={saving}>
                                                {saving ? <Spinner size="sm" animation="border" /> : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </Form>
                                </Tab>
                                <Tab eventKey="security" title="Security">
                                    <Form onSubmit={handleUpdatePassword}>
                                        <Form.Group className="mb-3" controlId="newPass">
                                            <Form.Label>New Password</Form.Label>
                                            <Form.Control
                                                type="password"
                                                value={passwords.new}
                                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-4" controlId="confirmNewPass">
                                            <Form.Label>Confirm New Password</Form.Label>
                                            <Form.Control
                                                type="password"
                                                value={passwords.confirm}
                                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                        <div className="text-end">
                                            <Button variant="warning" type="submit" disabled={saving}>
                                                {saving ? <Spinner size="sm" animation="border" /> : 'Update Password'}
                                            </Button>
                                        </div>
                                    </Form>
                                </Tab>
                            </Tabs>

                            <hr className="my-4" />

                            <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded">
                                <div>
                                    <h5 className="text-danger mb-0">Sign Out</h5>
                                    <small className="text-muted">Sign out of your account</small>
                                </div>
                                <Button variant="outline-danger" onClick={handleLogout}>Logout</Button>
                            </div>

                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default StudentProfile;

