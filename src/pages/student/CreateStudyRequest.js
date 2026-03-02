import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const CreateStudyRequest = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const mentorIdFromUrl = searchParams.get('mentorId');

    const [loading, setLoading] = useState(false);
    const [mentor, setMentor] = useState(null);
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        subject: '',
        topic: '',
        mode: 'online',
        date: '',
        time: '',
        duration: '1 Hour',
        phone: '',
        location: ''
    });

    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
                if (profileSnap.exists()) {
                    const data = profileSnap.data();
                    setUserProfile(data);
                    // Pre-fill phone and location if exists
                    setFormData(prev => ({
                        ...prev,
                        phone: data.phone || '',
                        location: data.location || ''
                    }));
                }
            }
        });

        if (mentorIdFromUrl) {
            const fetchMentor = async () => {
                const docRef = doc(db, "users", mentorIdFromUrl);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setMentor({ id: docSnap.id, ...docSnap.data() });
                    setFormData(prev => ({ ...prev, subject: docSnap.data().subject || '' }));
                }
            };
            fetchMentor();
        }

        // Fetch subjects
        const unsubscribeSubjects = onSnapshot(collection(db, "subjects"), (snapshot) => {
            const subs = snapshot.docs.map(doc => doc.data().name);
            subs.sort();
            setSubjects(subs);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeSubjects();
        };
    }, [mentorIdFromUrl]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError('You must be logged in to create a request.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Update user profile automatically (Auto-Save)
            await updateDoc(doc(db, "users", user.uid), {
                phone: formData.phone,
                location: formData.location,
                updatedAt: serverTimestamp()
            });

            // 2. Add the study request
            await addDoc(collection(db, "requests"), {
                subject: formData.subject,
                topic: formData.topic,
                mode: formData.mode,
                date: formData.date,
                time: formData.time,
                duration: formData.duration,
                studentId: user.uid,
                studentName: userProfile?.name || user.email,
                studentPhone: formData.phone,
                studentLocation: formData.location,
                mentorId: mentorIdFromUrl || 'pending',
                mentorName: mentor?.name || 'Any Mentor',
                status: 'Pending',
                timestamp: serverTimestamp()
            });
            navigate('/student/requests');
        } catch (err) {
            console.error("Error adding document: ", err);
            setError('Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="shadow border-0 rounded-3">
                        <Card.Body className="p-4">
                            <h3 className="fw-bold mb-2">Create New Study Request</h3>
                            {mentor && (
                                <p className="text-muted mb-4">Requesting session with <strong>{mentor.name}</strong> ({mentor.subject})</p>
                            )}

                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group controlId="subject">
                                            <Form.Label>Subject</Form.Label>
                                            <Form.Select
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Subject</option>
                                                {subjects.map(sub => (
                                                    <option key={sub} value={sub}>{sub}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="mode">
                                            <Form.Label>Preferred Mode</Form.Label>
                                            <Form.Select
                                                value={formData.mode}
                                                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                                            >
                                                <option value="online">Online (Video Call)</option>
                                                <option value="in-person">In-Person</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3" controlId="topic">
                                    <Form.Label>Specific Topic / Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="E.g., I need help creating a React component..."
                                        value={formData.topic}
                                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group controlId="phone">
                                            <Form.Label>Your Phone Number</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                placeholder="e.g. +123 456 7890"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="location">
                                            <Form.Label>Your Location</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. New York, USA"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group controlId="date">
                                            <Form.Label>Preferred Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="time">
                                            <Form.Label>Preferred Time</Form.Label>
                                            <Form.Control
                                                type="time"
                                                value={formData.time}
                                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-4" controlId="duration">
                                    <Form.Label>Session Duration</Form.Label>
                                    <div className="d-flex gap-3">
                                        {['30 Min', '1 Hour', '2 Hours'].map((dur) => (
                                            <Form.Check
                                                key={dur}
                                                type="radio"
                                                label={dur}
                                                name="duration"
                                                id={`d${dur}`}
                                                checked={formData.duration === dur}
                                                onChange={() => setFormData({ ...formData, duration: dur })}
                                            />
                                        ))}
                                    </div>
                                </Form.Group>

                                <div className="d-grid">
                                    <Button variant="primary" size="lg" type="submit" disabled={loading}>
                                        {loading ? <Spinner size="sm" animation="border" /> : 'Post Request'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default CreateStudyRequest;
