import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaChalkboardTeacher } from 'react-icons/fa';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const MentorLogin = () => {
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

            // Check if user is a mentor and if they are approved
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().role === 'mentor') {
                if (userDoc.data().isApproved) {
                    navigate('/mentor/dashboard');
                } else {
                    navigate('/mentor/waiting-approval');
                }
            } else {
                await auth.signOut();
                setError("Access denied. This account is not registered as a mentor.");
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
                            <div className="bg-success text-white text-center py-4 bg-gradient" style={{ background: 'linear-gradient(135deg, #2ecc71, #27ae60)' }}>
                                <FaChalkboardTeacher size={50} className="mb-2" />
                                <h3 className="fw-bold mb-0">Mentor Access</h3>
                            </div>
                            <Card.Body className="p-5">
                                <p className="text-center text-muted mb-4">Sign in to manage your sessions and students.</p>

                                {error && <Alert variant="danger">{error}</Alert>}

                                <Form onSubmit={handleLogin}>
                                    <Form.Group className="mb-3" controlId="email">
                                        <Form.Label className="fw-semibold">Email Address</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="mentor@example.com"
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
                                        <Link to="/forgot-password" size="sm" className="text-success text-decoration-none fw-semibold">Forgot Password?</Link>
                                    </div>

                                    <div className="d-grid gap-2 mb-4">
                                        <Button variant="success" size="lg" type="submit" className="shadow-sm" disabled={loading}>
                                            {loading ? <Spinner size="sm" /> : 'Login as Mentor'}
                                        </Button>
                                    </div>
                                </Form>

                                <div className="text-center">
                                    <p className="text-muted mb-3">
                                        Join our network. <Link to="/mentor/register" className="fw-bold text-success text-decoration-none">Apply to be a Mentor</Link>
                                    </p>
                                    <hr className="my-4" />
                                    <div className="d-flex justify-content-center gap-3">
                                        <Link to="/student/login" className="btn btn-outline-secondary btn-sm rounded-pill px-3">Student Login</Link>
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

export default MentorLogin;

