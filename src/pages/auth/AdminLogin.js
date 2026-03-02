import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserShield } from 'react-icons/fa';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; // Added createUserWithEmailAndPassword
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'; // Added setDoc, serverTimestamp

const AdminLogin = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [seedMessage, setSeedMessage] = useState(''); // Added seedMessage state

    // Function to create the admin account requested by the user
    const handleSeedAdmin = async () => {
        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, "admin@example.com", "admin123");
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                name: "System Admin",
                email: "admin@example.com",
                role: "admin",
                createdAt: serverTimestamp()
            });

            await setDoc(doc(db, "admins", user.uid), {
                name: "System Admin",
                email: "admin@example.com",
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });

            setSeedMessage("Admin account created successfully! You can now login.");
        } catch (err) {
            console.error("Seed error:", err);
            setError("Admin account may already exist or error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSeedMessage(''); // Clear seed message on login attempt
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if user is an admin
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                await auth.signOut();
                setError("Access denied. Authorized Personnel Only.");
            }
        } catch (err) {
            console.error("Admin login error:", err);
            setError("Invalid credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-light" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md={6} lg={5}>
                        <Card className="shadow-lg border-0 rounded-4 overflow-hidden fade-in">
                            <div className="bg-danger text-white text-center py-4 bg-gradient" style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}>
                                <FaUserShield size={50} className="mb-2" />
                                <h3 className="fw-bold mb-0">Admin Portal</h3>
                            </div>
                            <Card.Body className="p-5">
                                <p className="text-center text-muted mb-4">Secure Area. Authorized Personnel Only.</p>

                                {error && <Alert variant="danger">{error}</Alert>}
                                {seedMessage && <Alert variant="success">{seedMessage}</Alert>}

                                <Form onSubmit={handleLogin}>
                                    <Form.Group className="mb-3" controlId="email">
                                        <Form.Label className="fw-semibold">Email Address</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="admin@studybuddy.com"
                                            size="lg"
                                            required
                                            className="bg-light text-dark border-0"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="password">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <Form.Label className="fw-semibold mb-0">Password</Form.Label>
                                            <Link to="/forgot-password" size="sm" className="text-danger text-decoration-none fw-semibold small">Forgot Password?</Link>
                                        </div>
                                        <Form.Control
                                            type="password"
                                            placeholder="••••••••"
                                            size="lg"
                                            required
                                            className="bg-light text-dark border-0"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </Form.Group>

                                    <div className="d-grid gap-2 mt-5">
                                        <Button variant="danger" size="lg" type="submit" className="shadow-sm" disabled={loading}>
                                            {loading ? <Spinner size="sm" /> : 'Access Dashboard'}
                                        </Button>
                                    </div>
                                </Form>

                                <div className="text-center mt-4 d-flex flex-column gap-2">
                                    <Link to="/" className="text-muted small text-decoration-none hover-underline">Back to Home</Link>
                                    <hr />
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="text-muted text-decoration-none"
                                        onClick={handleSeedAdmin}
                                        disabled={loading}
                                    >
                                        Initialize Default Admin Account
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default AdminLogin;

