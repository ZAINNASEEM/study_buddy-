import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaKey, FaChevronLeft, FaEnvelope } from 'react-icons/fa';
import { auth } from '../../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleReset = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage(
                <div>
                    <p className="mb-2"><strong>Success!</strong> If a matching account exists, a reset link will arrive shortly.</p>
                    <ul className="small mb-0 text-start">
                        <li>Check your <strong>Spam/Junk</strong> folder.</li>
                        <li>Ensure <code>{email}</code> is a <strong>real email address</strong>.</li>
                        <li>Wait 2-5 minutes; delivery can sometimes be delayed.</li>
                        <li>If testing with <code>@example.com</code>, no real email will be sent.</li>
                    </ul>
                </div>
            );
        } catch (err) {
            console.error("Reset error:", err);
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email address.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many requests. Please wait a few minutes before trying again.');
            } else {
                setError('Error: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-light" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md={6} lg={5}>
                        <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
                            <div className="bg-gradient-purple text-white text-center py-4">
                                <FaKey size={50} className="mb-2" />
                                <h3 className="fw-bold mb-0">Reset Password</h3>
                            </div>
                            <Card.Body className="p-5">
                                <p className="text-center text-muted mb-4">
                                    Enter your registered email and we'll send you a link to reset your password.
                                </p>

                                {message && <Alert variant="success" className="rounded-3">{message}</Alert>}
                                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

                                <Form onSubmit={handleReset}>
                                    <Form.Group className="mb-4" controlId="email">
                                        <Form.Label className="fw-semibold">Email Address</Form.Label>
                                        <div className="position-relative">
                                            <Form.Control
                                                type="email"
                                                placeholder="Enter your email"
                                                size="lg"
                                                required
                                                className="bg-light border-0 ps-5"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                            <FaEnvelope className="position-absolute top-50 translate-middle-y ms-3 text-muted" />
                                        </div>
                                    </Form.Group>

                                    <div className="d-grid gap-2 mb-4">
                                        <Button variant="none" size="lg" type="submit" className="btn-purple shadow-sm fw-bold" disabled={loading}>
                                            {loading ? <Spinner size="sm" /> : 'Send Reset Link'}
                                        </Button>
                                    </div>
                                </Form>

                                <div className="text-center">
                                    <Link to="/student/login" className="text-decoration-none text-purple fw-bold d-flex align-items-center justify-content-center gap-2">
                                        <FaChevronLeft size={12} /> Back to Login
                                    </Link>
                                </div>
                            </Card.Body>
                        </Card>

                        <div className="text-center mt-4">
                            <p className="text-muted small px-4">
                                <strong>Note:</strong> If you used a fake email like <code>@example.com</code> during testing, you will not receive a real email.
                            </p>
                        </div>
                    </Col>
                </Row>
            </Container>

            <style>{`
                .bg-gradient-purple { background: var(--gradient-purple) !important; }
                .text-purple { color: var(--primary-purple) !important; }
                .btn-purple { 
                    background: var(--gradient-purple) !important; 
                    color: white !important;
                    transition: all 0.3s ease;
                }
                .btn-purple:hover { 
                    opacity: 0.9;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(111, 66, 193, 0.3) !important;
                }
            `}</style>
        </div>
    );
};

export default ForgotPassword;
