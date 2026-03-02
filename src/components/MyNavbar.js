import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const MyNavbar = () => {
    const navigate = useNavigate();

    return (
        <Navbar expand="lg" className="navbar-custom sticky-top py-3">
            <Container>
                <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
                    <span className="fw-bold fs-4 text-gradient">Study-Buddy</span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto align-items-center gap-3">
                        <Nav.Link as={Link} to="/" className="fw-medium">Home</Nav.Link>
                        <Nav.Link as={Link} to="/student/login" className="fw-medium">Student</Nav.Link>
                        <Nav.Link as={Link} to="/mentor/login" className="fw-medium">Mentor</Nav.Link>

                        <Button className="btn-primary rounded-pill px-4 fw-bold" onClick={() => navigate('/student/register')}>
                            Get Started
                        </Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default MyNavbar;
