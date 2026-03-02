import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaClock } from 'react-icons/fa';

const WaitingApproval = () => {
    return (
        <Container className="py-5">
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Card className="text-center shadow-lg border-0 p-5 rounded-3" style={{ maxWidth: '600px' }}>
                    <Card.Body>
                        <div className="text-warning mb-4">
                            <FaClock size={80} />
                        </div>
                        <h2 className="fw-bold mb-3">Application Under Review</h2>
                        <Card.Text className="text-muted mb-4 lead">
                            Thank you for applying to be a mentor! Your application has been received and is currently being reviewed by our admin team.
                        </Card.Text>
                        <p className="mb-4">
                            We will notify you via email once your account status has been updated. This process usually takes 24-48 hours.
                        </p>
                        <Button as={Link} to="/" variant="primary" size="lg">
                            Return Home
                        </Button>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
};

export default WaitingApproval;
