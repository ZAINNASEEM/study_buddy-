import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
    return (
        <footer className="footer-custom mt-auto">
            <Container>
                <Row>
                    <Col md={4} className="mb-4">
                        <h5 className="fw-bold">Study-Buddy</h5>
                        <p className="small" style={{ maxWidth: '300px' }}>
                            Empowering students and mentors to connect, learn, and grow together in a collaborative environment.
                        </p>
                    </Col>
                    <Col md={4} className="mb-4">
                        <h5>Quick Links</h5>
                        <ul className="list-unstyled small d-flex flex-column gap-2">
                            <li><a href="/">Home</a></li>
                            <li><a href="/student/login">Find a Mentor</a></li>
                            <li><a href="/mentor/register">Become a Mentor</a></li>
                        </ul>
                    </Col>
                    <Col md={4} className="mb-4">
                        <h5>Contact Us</h5>
                        <p className="small">
                            support@studybuddy.com<br />
                            +1 (555) 123-4567
                        </p>
                    </Col>
                </Row>
                <hr />
                <div className="text-center small opacity-75">
                    &copy; {new Date().getFullYear()} Study-Buddy Platform. All rights reserved.
                </div>
            </Container>
        </footer>
    );
};

export default Footer;
