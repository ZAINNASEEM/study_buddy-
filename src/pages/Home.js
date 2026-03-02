import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaChalkboardTeacher, FaUserGraduate, FaLaptopCode, FaArrowRight } from 'react-icons/fa';
import banner from '../assets/banner.png';

const Home = () => {
    return (
        <div className="fade-in">
            {/* Hero Section */}
            <div className="py-5 mb-5 align-items-center d-flex" style={{ minHeight: '80vh', background: 'linear-gradient(to right, #f8f9fa, #e9ecef)' }}>
                <Container>
                    <Row className="align-items-center">
                        <Col md={6} className="mb-5 mb-md-0">
                            <span className="badge bg-light text-primary border border-primary fw-bold mb-3 px-3 py-2 rounded-pill shadow-sm">
                                🚀 The #1 Learning Platform
                            </span>
                            <h1 className="display-3 fw-bold mb-3 text-dark">
                                Master Any Subject with <br />
                                <span className="text-gradient">Expert Mentors</span>
                            </h1>
                            <p className="lead text-muted mb-4" style={{ fontSize: '1.2rem' }}>
                                Connect with top-tier mentors and peers. Schedule sessions, track progress,
                                and accelerate your academic journey with Study-Buddy.
                            </p>
                            <div className="d-flex gap-3">
                                <Button as={Link} to="/student/register" className="btn-primary rounded-pill px-4 py-3 fw-bold d-flex align-items-center shadow-lg">
                                    Start Learning <FaArrowRight className="ms-2" />
                                </Button>
                                <Button as={Link} to="/mentor/register" variant="outline-primary" className="rounded-pill px-4 py-3 fw-bold">
                                    Become a Mentor
                                </Button>
                            </div>
                            <div className="mt-4 d-flex align-items-center gap-4 text-muted small">
                                <div className="d-flex align-items-center"><FaUserGraduate className="me-2 text-success" /> 5k+ Students</div>
                                <div className="d-flex align-items-center"><FaChalkboardTeacher className="me-2 text-warning" /> 500+ Mentors</div>
                            </div>
                        </Col>
                        <Col md={6} className="text-center">
                            <div className="position-relative">
                                <div className="position-absolute top-50 start-50 translate-middle w-100 h-100 bg-gradient-primary rounded-circle opacity-25 blur-lg" style={{ filter: 'blur(60px)', zIndex: 0 }}></div>
                                <img src={banner} alt="Study Group" className="img-fluid rounded-4 shadow-lg position-relative" style={{ zIndex: 1, transform: 'rotate(-2deg)', border: '5px solid white' }} />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Features Section */}
            <Container className="mb-5 py-5">
                <Row className="text-center mb-5">
                    <Col md={8} className="mx-auto">
                        <h2 className="fw-bold display-6 mb-3">Why Choose <span className="text-gradient">Study-Buddy?</span></h2>
                        <p className="text-muted lead">Empowering your education with the right tools, connections, and personalized support.</p>
                    </Col>
                </Row>
                <Row className="g-4">
                    <Col md={4}>
                        <Card className="h-100 border-0 p-4 text-center hover-card" style={{ background: '#ffffff' }}>
                            <Card.Body>
                                <div className="bg-light rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center text-primary" style={{ width: '80px', height: '80px' }}>
                                    <FaChalkboardTeacher size={35} />
                                </div>
                                <Card.Title className="fw-bold h4 mb-3">Expert Mentors</Card.Title>
                                <Card.Text className="text-muted">
                                    Access a wide network of qualified mentors in various subjects ready to guide you through complex topics.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100 border-0 p-4 text-center hover-card" style={{ background: '#ffffff' }}>
                            <Card.Body>
                                <div className="bg-light rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center text-accent" style={{ width: '80px', height: '80px', color: 'var(--accent-color)' }}>
                                    <FaUserGraduate size={35} />
                                </div>
                                <Card.Title className="fw-bold h4 mb-3">Personalized Learning</Card.Title>
                                <Card.Text className="text-muted">
                                    Get tailored support that fits your specific learning style, pace, and academic goals for maximum retention.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100 border-0 p-4 text-center hover-card" style={{ background: '#ffffff' }}>
                            <Card.Body>
                                <div className="bg-light rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center text-success" style={{ width: '80px', height: '80px' }}>
                                    <FaLaptopCode size={35} />
                                </div>
                                <Card.Title className="fw-bold h4 mb-3">Seamless Scheduling</Card.Title>
                                <Card.Text className="text-muted">
                                    Easily book sessions, manage your calendar, and attend online meetings with our integrated video platform.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Home;
