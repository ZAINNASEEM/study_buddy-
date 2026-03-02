import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaSearch, FaSyncAlt, FaFilter } from 'react-icons/fa';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp, setDoc, doc, getDoc } from 'firebase/firestore';

const SearchMentors = () => {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [subjects, setSubjects] = useState(['All Subjects']);
    const [selectedSubject, setSelectedSubject] = useState('All Subjects');
    const [seeding, setSeeding] = useState(false);
    const [seedMessage, setSeedMessage] = useState('');

    useEffect(() => {
        setLoading(true);
        // Listen to all mentors from 'mentors' collection
        const q = query(
            collection(db, "mentors"),
            where("status", "==", "Active")
        );
        const unsubscribeMentors = onSnapshot(q, (snapshot) => {
            const mentorData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMentors(mentorData);
            setLoading(false);
        });

        // Fetch subjects
        const qSub = query(collection(db, "subjects"));
        const unsubscribeSubjects = onSnapshot(qSub, (snapshot) => {
            const subs = snapshot.docs.map(doc => doc.data().name);
            const uniqueSubs = [...new Set(subs)].filter(Boolean).sort();
            setSubjects(['All Subjects', ...uniqueSubs]);
        });

        return () => {
            unsubscribeMentors();
            unsubscribeSubjects();
        };
    }, []);

    const seedData = async () => {
        setSeeding(true);
        setSeedMessage('');
        try {
            // 1. Migration from 'users' to 'mentors'
            const existingMentorsQuery = query(collection(db, "users"), where("role", "==", "mentor"));
            const existingMentorsSnap = await getDocs(existingMentorsQuery);
            let migratedCount = 0;

            for (const docSnap of existingMentorsSnap.docs) {
                const mentorId = docSnap.id;
                const mentorData = docSnap.data();
                const mentorRef = doc(db, "mentors", mentorId);
                const existingMentorRef = await getDoc(mentorRef);

                if (!existingMentorRef.exists()) {
                    await setDoc(mentorRef, {
                        ...mentorData,
                        createdAt: mentorData.createdAt || serverTimestamp(),
                        status: mentorData.status || 'Active',
                        isApproved: mentorData.isApproved !== undefined ? mentorData.isApproved : true
                    });
                    migratedCount++;
                }
            }

            // 2. Seed Subjects
            const subjectsToSeed = [
                "Mathematics", "Physics", "Computer Science", "Chemistry", "Biology",
                "Cybersecurity", "Data Science", "DevOps", "Machine Learning",
                "Artificial Intelligence", "Cloud Computing", "Tamil", "English"
            ];

            for (const sub of subjectsToSeed) {
                const subQuery = query(collection(db, "subjects"), where("name", "==", sub));
                const subSnap = await getDocs(subQuery);
                if (subSnap.empty) {
                    await addDoc(collection(db, "subjects"), { name: sub, createdAt: serverTimestamp() });
                }
            }

            // 3. Seed New Mentors
            const mentorsToSeed = [
                { name: "Dr. Sarah Chen", email: "sarah.chen@example.com", subject: "Data Science", bio: "Former Google data scientist. Expert in Python and Big Data.", location: "San Francisco, CA", status: "Active", experience: "10+ Years", education: "PhD CS", rating: 4.9 },
                { name: "Marcus Thorne", email: "marcus.t@example.com", subject: "Cybersecurity", bio: "Certified Ethical Hacker. Specialized in network security.", location: "London, UK", status: "Active", experience: "8 Years", education: "BSc InfoSec", rating: 4.8 },
                { name: "Elena Rodriguez", email: "elena.r@example.com", subject: "Machine Learning", bio: "Neural network specialist. Deep learning model enthusiast.", location: "Madrid, Spain", status: "Active", experience: "5 Years", education: "MSc AI", rating: 4.7 }
            ];

            for (const m of mentorsToSeed) {
                const mQuery = query(collection(db, "mentors"), where("email", "==", m.email));
                const mSnap = await getDocs(mQuery);
                if (mSnap.empty) {
                    // Since these are new seed mentors, we don't necessarily have a user account for them in 'users' here,
                    // but for common testing, we add them to 'mentors' so they show up in search.
                    await addDoc(collection(db, "mentors"), {
                        ...m,
                        joined: new Date().toISOString().split('T')[0],
                        createdAt: serverTimestamp()
                    });
                }
            }
            setSeedMessage(`Successfully migrated ${migratedCount} mentors and seeded new data!`);
        } catch (error) {
            console.error("Error seeding/migrating data:", error);
            setSeedMessage('Error: ' + error.message);
        } finally {
            setSeeding(false);
        }
    };

    const filteredMentors = mentors.filter(mentor => {
        if (mentor.status !== 'Active' && mentor.role === 'mentor') {
            // If it's a mentor but not active, exclude unless we are admin view (but this is search)
            if (mentor.id === 'placeholder') return false;
        }

        const name = (mentor.name || '').toLowerCase();
        const bio = (mentor.bio || '').toLowerCase();
        const subject = (mentor.subject || '').toLowerCase();
        const terms = searchTerm.toLowerCase();

        const matchesSearch = name.includes(terms) || bio.includes(terms) || subject.includes(terms);
        const matchesSubject = selectedSubject === 'All Subjects' || mentor.subject === selectedSubject;

        return mentor.role === 'mentor' && mentor.status === 'Active' && matchesSearch && matchesSubject;
    });

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" style={{ color: 'var(--primary-purple)' }} />
            </div>
        );
    }

    return (
        <Container className="py-5">
            <Row className="mb-4 align-items-center">
                <Col md={8}>
                    <h2 className="fw-bold display-5 mb-1 text-gradient-purple">Explore Mentors</h2>
                    <p className="text-muted lead">Connect with world-class experts in your field of study.</p>
                </Col>
                <Col md={4} className="text-md-end">
                    <Button
                        variant="none"
                        onClick={seedData}
                        disabled={seeding}
                        className="btn-purple rounded-pill px-4 py-2 shadow-sm d-inline-flex align-items-center"
                    >
                        {seeding ? <Spinner size="sm" className="me-2" /> : <FaSyncAlt className="me-2" />}
                        Add More Mentors
                    </Button>
                </Col>
            </Row>

            {seedMessage && (
                <Alert variant={seedMessage.includes('Error') ? 'danger' : 'success'} dismissible onClose={() => setSeedMessage('')} className="mb-4 rounded-4 shadow-sm border-0">
                    {seedMessage}
                </Alert>
            )}

            <Row>
                {/* Filters Sidebar */}
                <Col lg={3} className="mb-4">
                    <Card className="card-purple p-2 sticky-top" style={{ top: '20px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4 text-purple">
                                <FaFilter />
                                <h5 className="fw-bold mb-0">Search Filters</h5>
                            </div>
                            <Form>
                                <Form.Group className="mb-4">
                                    <Form.Label className="small fw-bold text-uppercase text-muted mb-2 ps-1 text-purple">Subject Expertise</Form.Label>
                                    <Form.Select
                                        className="form-control-custom-purple px-3 py-2"
                                        style={{ borderRadius: '12px', border: '2px solid #eee' }}
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                    >
                                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="small fw-bold text-uppercase text-muted mb-2 ps-1 text-purple">Rating Score</Form.Label>
                                    <Form.Range min={0} max={5} step={0.5} className="mt-1 custom-range-purple" />
                                    <div className="d-flex justify-content-between small text-muted px-1">
                                        <span>0.0</span>
                                        <span>5.0</span>
                                    </div>
                                </Form.Group>

                                <Button
                                    variant="none"
                                    className="w-100 rounded-pill py-2 text-purple fw-bold hover-light-purple"
                                    style={{ background: 'var(--light-purple)', transition: '0.3s' }}
                                    onClick={() => { setSearchTerm(''); setSelectedSubject('All Subjects'); }}
                                >
                                    Reset All
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Results - Purple Theme */}
                <Col lg={9}>
                    <div className="position-relative mb-5">
                        <Form.Control
                            type="search"
                            placeholder="Find by name, subject, or mentor bio..."
                            className="ps-5 py-3 border-0 shadow-sm rounded-pill"
                            style={{ fontSize: '1.1rem', background: 'white' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FaSearch className="position-absolute top-50 translate-middle-y start-0 ms-4 text-purple" size={18} />
                    </div>

                    {filteredMentors.length > 0 ? (
                        <Row className="g-4">
                            {filteredMentors.map((mentor) => (
                                <Col md={12} key={mentor.id}>
                                    <Card className="card-purple h-100 overflow-hidden">
                                        <Card.Body className="p-0">
                                            <Row className="g-0">
                                                <Col md={3} className="bg-gradient-purple d-flex align-items-center justify-content-center py-4" style={{ minHeight: '150px' }}>
                                                    <div className="bg-white rounded-circle shadow-lg d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                                                        <span className="h1 mb-0 text-gradient-purple fw-bold">{(mentor.name || 'M').charAt(0)}</span>
                                                    </div>
                                                </Col>
                                                <Col md={9} className="p-4 d-flex flex-column justify-content-between">
                                                    <div>
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <div>
                                                                <h4 className="fw-bold mb-0 text-dark">{mentor.name}</h4>
                                                                <p className="text-purple fw-bold mb-0 small">{mentor.subject}</p>
                                                            </div>
                                                            <div className="text-warning fw-bold fs-5">
                                                                <FaStar className="me-1 mb-1" />{mentor.rating || '5.0'}
                                                            </div>
                                                        </div>
                                                        <div className="mb-3 d-flex gap-3 small text-muted">
                                                            <span><FaMapMarkerAlt className="text-accent me-1" />{mentor.location || 'Online'}</span>
                                                            <span className="badge bg-purple bg-opacity-10 text-purple rounded-pill px-3 py-1 fw-medium">Active</span>
                                                        </div>
                                                        <p className="text-muted mb-4 small lead" style={{ lineHeight: '1.6' }}>
                                                            {mentor.bio || 'Expert mentor dedicated to providing quality educational guidance and support.'}
                                                        </p>
                                                    </div>
                                                    <div className="d-flex gap-2">
                                                        <Button as={Link} to={`/student/mentor/${mentor.id}`} variant="none" className="btn-purple rounded-pill px-4 flex-grow-1">View Full Profile</Button>
                                                        <Button as={Link} to={`/student/create-request?mentorId=${mentor.id}`} variant="none" className="rounded-pill px-4 text-purple border-purple border-2 fw-bold">Book Now</Button>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <div className="text-center py-5 bg-white rounded-4 shadow-sm border-0 mt-4 card-purple">
                            <div className="display-1 text-purple opacity-25 mb-4">
                                <FaSearch />
                            </div>
                            <h3 className="fw-bold text-dark">No Mentors Found</h3>
                            <p className="text-muted mb-4 px-5">Your search didn't match any mentors. Try adjusting your filters or search keywords.</p>
                            <Button variant="none" className="btn-purple rounded-pill px-5 py-2 fw-bold" onClick={() => { setSearchTerm(''); setSelectedSubject('All Subjects'); }}>
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </Col>
            </Row>

            <style>{`
                .form-control-custom-purple:focus { border-color: var(--primary-purple) !important; box-shadow: 0 0 0 0.25rem rgba(111, 66, 193, 0.1) !important; }
                .hover-light-purple:hover { background: #e8d5f3 !important; }
                .text-gradient-purple { background: var(--gradient-purple); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .border-purple { border-color: var(--primary-purple) !important; border: 2px solid var(--primary-purple) }
                .custom-range-purple::-webkit-slider-thumb { background: var(--primary-purple); }
            `}</style>
        </Container>
    );
};

export default SearchMentors;


