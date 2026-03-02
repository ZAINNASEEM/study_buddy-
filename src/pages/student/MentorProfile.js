import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaChevronLeft } from 'react-icons/fa';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const MentorProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mentor, setMentor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMentor = async () => {
            try {
                const docRef = doc(db, "mentors", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setMentor({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching mentor:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMentor();
    }, [id]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" style={{ color: 'var(--primary-purple)' }} />
            </div>
        );
    }

    if (!mentor) {
        return (
            <Container className="py-5 text-center">
                <h3 className="fw-bold text-dark">Mentor not found</h3>
                <Button variant="none" as={Link} to="/student/search" className="btn-purple rounded-pill px-5 mt-3">Back to Search</Button>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <Button variant="link" className="text-decoration-none text-purple mb-4 p-0 fw-bold" onClick={() => navigate(-1)}>
                <FaChevronLeft className="me-1" /> Back to Mentors
            </Button>

            <Row className="justify-content-center">
                <Col md={10}>
                    <Card className="card-purple shadow border-0 rounded-3 overflow-hidden">
                        <div className="bg-gradient-purple" style={{ height: '150px' }}></div>
                        <Card.Body className="position-relative px-lg-5 pt-0 pb-5">
                            <div className="bg-white rounded-circle border border-4 border-white position-absolute translate-middle-y d-flex align-items-center justify-content-center shadow-sm overflow-hidden" style={{ width: '150px', height: '150px', top: '0', left: '50px' }}>
                                {mentor.photoURL ? (
                                    <img src={mentor.photoURL} alt={mentor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span className="h1 text-gradient-purple fw-bold">{(mentor.name || 'M').charAt(0)}</span>
                                )}
                            </div>

                            <div className="mt-5 pt-4 d-md-flex justify-content-between align-items-start">
                                <div className="mt-4 mt-md-0">
                                    <h2 className="fw-bold mb-1 text-dark">{mentor.name}</h2>
                                    <p className="text-purple fw-bold mb-1">{mentor.subject || 'Expert Mentor'}</p>
                                    <div className="text-muted mb-3 small d-flex flex-wrap gap-3">
                                        <span><FaMapMarkerAlt className="text-danger" /> {mentor.location || 'Online'}</span>
                                        <span className="text-warning fw-bold"><FaStar /> {mentor.rating || '5.0'} Rating</span>
                                    </div>
                                </div>
                                <div className="d-flex gap-2 mt-3 mt-md-0">
                                    <Button as={Link} to={`/student/chat/${mentor.id}`} variant="outline-primary" className="rounded-pill px-4 text-purple border-purple border-2 fw-bold">Message</Button>
                                    <Button as={Link} to={`/student/create-request?mentorId=${mentor.id}`} variant="none" className="btn-purple rounded-pill px-4 fw-bold">Request Session</Button>
                                </div>
                            </div>

                            <hr className="my-4" />

                            <Row className="mt-4">
                                <Col lg={8}>
                                    <h5 className="fw-bold mb-3 text-purple">About</h5>
                                    <p className="text-muted mb-4 lead" style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>
                                        {mentor.bio || "Experienced mentor ready to help you achieve your goals and master complex concepts."}
                                    </p>

                                    {mentor.experience && (
                                        <>
                                            <h5 className="fw-bold mt-4 mb-3 text-purple">Experience</h5>
                                            <p className="text-muted mb-4">{mentor.experience}</p>
                                        </>
                                    )}

                                    {mentor.education && (
                                        <>
                                            <h5 className="fw-bold mt-4 mb-3 text-purple">Education</h5>
                                            <p className="text-muted mb-4">{mentor.education}</p>
                                        </>
                                    )}
                                </Col>

                                <Col lg={4}>
                                    <Card className="bg-light border-0 shadow-none sticky-top" style={{ top: '20px', borderRadius: '15px' }}>
                                        <Card.Body className="p-4">
                                            <h6 className="fw-bold mb-3 text-purple">Subject Expertise</h6>
                                            <div className="d-flex flex-wrap gap-2 mb-4">
                                                <Badge bg="none" className="bg-purple bg-opacity-10 text-purple px-3 py-2 rounded-pill fw-bold border border-purple">{mentor.subject}</Badge>
                                            </div>

                                            <h6 className="fw-bold mb-2">Availability</h6>
                                            <p className="small text-muted mb-0">{mentor.availability || 'Weekdays: 6 PM - 9 PM'}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <style>{styles}</style>
        </Container>
    );
};

const styles = `
    .text-purple { color: var(--primary-purple) !important; }
    .border-purple { border: 2px solid var(--primary-purple) !important; }
    .text-accent { color: var(--accent-color) !important; }
    .bg-gradient-purple { background: var(--gradient-purple) !important; }
    .card-purple:hover { transform: translateY(-5px); box-shadow: 0 1rem 3rem rgba(111, 66, 193, 0.1) !important; }
`;

export default MentorProfile;

