import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const StudentRegister = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

            // Update the Auth profile display name (non-fatal)
            try {
                await updateProfile(user, { displayName: fullName });
            } catch (e) {
                // ignore
            }

            // Save user profile to Firestore (merge to avoid overwriting extra fields)
            await setDoc(doc(db, "users", user.uid), {
                firstName: formData.firstName,
                lastName: formData.lastName,
                name: fullName,
                email: formData.email,
                phone: formData.phone,
                role: 'student',
                status: 'Active',
                joined: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp()
            }, { merge: true });

            // Show success message briefly then navigate
            setSuccess('Account created successfully — redirecting to your dashboard...');
            setTimeout(() => navigate('/student/dashboard'), 800);
        } catch (err) {
            console.error("Registration error:", err);
            if (err && err.code === 'auth/configuration-not-found') {
                setError('Authentication is not fully configured for this Firebase project. Please enable Email/Password sign-in in the Firebase Console (Authentication → Sign-in method → Email/Password).');
            } else if (err && err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists. Try logging in or resetting the password.');
            } else {
                setError(err.message || "Failed to create account.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow-lg border-0 rounded-3">
                        <Card.Body className="p-5">
                            <h2 className="text-center fw-bold mb-2">Create Account</h2>
                            <p className="text-center text-muted mb-4">Join Study-Buddy as a Student</p>

                            {error && (
                                <>
                                    <Alert variant="danger">{error}</Alert>
                                    {error.includes('Authentication is not fully configured') && (
                                        <Alert variant="warning">
                                            To enable Email/Password sign-in, go to the Firebase Console for this project and enable <strong>Email/Password</strong> under <em>Authentication → Sign-in method</em>.
                                            {' '}
                                            <a href={`https://console.firebase.google.com/project/${process.env.REACT_APP_FIREBASE_PROJECT_ID || 'studybuddy-a1da4'}/authentication/providers`} target="_blank" rel="noreferrer">Open Firebase Console</a>
                                        </Alert>
                                    )}
                                </>
                            )}

                            {success && (
                                <Alert variant="success">{success}</Alert>
                            )}

                            <Form onSubmit={handleRegister}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="firstName">
                                            <Form.Label>First Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="John"
                                                required
                                                value={formData.firstName}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="lastName">
                                            <Form.Label>Last Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Doe"
                                                required
                                                value={formData.lastName}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3" controlId="email">
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="student@example.com"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="phone">
                                    <Form.Label>Phone Number</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        placeholder="+1234567890"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="password">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="********"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="confirmPassword">
                                    <Form.Label>Confirm Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="********"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                <div className="d-grid gap-2">
                                    <Button variant="primary" size="lg" type="submit" disabled={loading}>
                                        {loading ? <Spinner size="sm" /> : 'Register'}
                                    </Button>
                                </div>
                            </Form>

                            <div className="text-center mt-4">
                                <p className="text-muted">
                                    Already have an account? <Link to="/student/login" className="fw-bold text-decoration-none">Login Here</Link>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default StudentRegister;

