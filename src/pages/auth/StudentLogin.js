import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserGraduate } from 'react-icons/fa';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const StudentLogin = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if user is a student
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().role === 'student') {
                navigate('/student/dashboard');
            } else {
                await auth.signOut();
                setError("Access denied. This account is not registered as a student.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Invalid email or password.");
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
                            <div className="bg-primary text-white text-center py-4 bg-gradient-primary">
                                <FaUserGraduate size={50} className="mb-2" />
                                <h3 className="fw-bold mb-0">Student Login</h3>
                            </div>
                            <Card.Body className="p-5">
                                <p className="text-center text-muted mb-4">Welcome back! Please access your account.</p>

                                {error && <Alert variant="danger">{error}</Alert>}

                                <Form onSubmit={handleLogin}>
                                    <Form.Group className="mb-3" controlId="email">
                                        <Form.Label className="fw-semibold">Email Address</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="name@school.edu"
                                            size="lg"
                                            required
                                            className="bg-light text-dark border-0"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="password">
                                        <Form.Label className="fw-semibold">Password</Form.Label>
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

                                    <div className="d-flex justify-content-between align-items-center mb-4 text-sm">
                                        <Form.Check type="checkbox" label="Remember me" id="rememberMe" className="text-muted" />
                                        <Link to="/forgot-password" size="sm" className="text-primary text-decoration-none fw-semibold">Forgot Password?</Link>
                                    </div>

                                    <div className="d-grid gap-2 mb-4">
                                        <Button className="btn-primary" size="lg" type="submit" disabled={loading}>
                                            {loading ? <Spinner size="sm" /> : 'Sign In'}
                                        </Button>
                                    </div>
                                </Form>

                                <div className="text-center">
                                    <p className="text-muted mb-3">
                                        New to Study-Buddy? <Link to="/student/register" className="fw-bold text-primary text-decoration-none">Create Account</Link>
                                    </p>
                                    <hr className="my-4" />
                                    <div className="d-flex justify-content-center gap-3">
                                        <Link to="/mentor/login" className="btn btn-outline-secondary btn-sm rounded-pill px-3">Are you a Mentor?</Link>
                                        <Link to="/admin/login" className="btn btn-outline-secondary btn-sm rounded-pill px-3">Admin Access</Link>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default StudentLogin;

