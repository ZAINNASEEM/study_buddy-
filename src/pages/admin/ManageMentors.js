import React, { useState, useEffect } from 'react';
import { Card, Table, Button, FormControl, InputGroup, Badge, Container, Modal, Form, Spinner } from 'react-bootstrap';
import { FaSearch, FaPause, FaPlay, FaUserPlus, FaTrash, FaEnvelope, FaBook, FaStar, FaEdit } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { db } from '../../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

const ManageMentors = () => {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [currentMentor, setCurrentMentor] = useState({ id: '', name: '', email: '', subject: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setLoading(true);
        // Query from 'mentors' instead of 'users'
        const q = query(collection(db, "mentors"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const mentorData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMentors(mentorData);
            setLoading(false);
        });

        const qSub = query(collection(db, "subjects"));
        const unsubscribeSubs = onSnapshot(qSub, (snapshot) => {
            const subs = snapshot.docs.map(doc => doc.data().name);
            subs.sort();
            setSubjects(subs);
        });

        return () => {
            unsubscribe();
            unsubscribeSubs();
        };
    }, []);

    // Filter Mentors
    const filteredMentors = mentors.filter(mentor =>
        (mentor.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mentor.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mentor.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(mentor.expertise) && mentor.expertise.some(e => e.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    // Handlers
    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        try {
            // Update in mentors (Primary)
            await updateDoc(doc(db, "mentors", id), { status: newStatus });

            // Also update in users for consistency
            try {
                const userDoc = await getDoc(doc(db, "users", id));
                if (userDoc.exists()) {
                    await updateDoc(doc(db, "users", id), { status: newStatus });
                }
            } catch (e) { }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this mentor? This cannot be undone.')) {
            try {
                // Delete from mentors
                await deleteDoc(doc(db, "mentors", id));

                // Also delete from users if it exists
                try {
                    await deleteDoc(doc(db, "users", id));
                } catch (e) { }
            } catch (error) {
                console.error("Error deleting mentor:", error);
                alert("Failed to delete mentor");
            }
        }
    };

    const handleOpenModal = (mentor = { id: '', name: '', email: '', subject: subjects.length > 0 ? subjects[0] : '' }) => {
        setCurrentMentor(mentor);
        setEditMode(!!mentor.id);
        setShowModal(true);
    };

    const handleSaveMentor = async () => {
        if (!currentMentor.name || !currentMentor.email) {
            alert("Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            if (editMode) {
                // Update in mentors
                await updateDoc(doc(db, "mentors", currentMentor.id), {
                    name: currentMentor.name,
                    email: currentMentor.email,
                    subject: currentMentor.subject,
                    expertise: [currentMentor.subject], // Keep expertise in sync
                    updatedAt: serverTimestamp()
                });

                // Update in users
                await updateDoc(doc(db, "users", currentMentor.id), {
                    name: currentMentor.name,
                    email: currentMentor.email,
                    subject: currentMentor.subject,
                    updatedAt: serverTimestamp()
                });
            } else {
                // For new mentors via Admin, we just add to both collections
                // Note: This doesn't create Firebase Auth account
                const mentorRef = await addDoc(collection(db, "mentors"), {
                    name: currentMentor.name,
                    email: currentMentor.email,
                    subject: currentMentor.subject,
                    expertise: [currentMentor.subject],
                    role: 'mentor',
                    status: 'Active',
                    isApproved: true,
                    rating: 5.0,
                    joined: new Date().toISOString().split('T')[0],
                    createdAt: serverTimestamp()
                });

                await setDoc(doc(db, "users", mentorRef.id), {
                    name: currentMentor.name,
                    email: currentMentor.email,
                    role: 'mentor',
                    status: 'Active',
                    createdAt: serverTimestamp()
                });
            }
            setShowModal(false);
        } catch (error) {
            console.error("Error saving mentor:", error);
            alert("Failed to save mentor.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="admin">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <Container fluid className="px-0">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h2 className="fw-bold mb-1" style={{ color: '#2c3e50' }}>Manage Mentors</h2>
                        <p className="text-muted mb-0">Oversee and manage mentor accounts.</p>
                    </div>
                    <div className="d-flex gap-2 w-100 w-md-auto">
                        <InputGroup className="shadow-sm" style={{ maxWidth: '300px' }}>
                            <InputGroup.Text className="bg-white border-end-0 text-muted"><FaSearch /></InputGroup.Text>
                            <FormControl
                                placeholder="Search mentors..."
                                className="border-start-0 ps-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </InputGroup>
                        <Button variant="primary" className="shadow-sm d-flex align-items-center gap-2 px-3" onClick={() => handleOpenModal()}>
                            <FaUserPlus /> <span className="d-none d-sm-inline">Add Mentor</span>
                        </Button>
                    </div>
                </div>

                <Card className="shadow-sm border-0 overflow-hidden" style={{ borderRadius: '15px' }}>
                    <Card.Body className="p-0">
                        <Table responsive hover className="align-middle mb-0">
                            <thead className="bg-light text-secondary">
                                <tr>
                                    <th className="ps-4 py-3 border-0">Mentor</th>
                                    <th className="py-3 border-0">Expertise</th>
                                    <th className="py-3 border-0">Rating</th>
                                    <th className="py-3 border-0">Status</th>
                                    <th className="pe-4 py-3 border-0 text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMentors.length > 0 ? (
                                    filteredMentors.map((mentor) => (
                                        <tr key={mentor.id} className="border-bottom">
                                            <td className="ps-4 py-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                                        <span className="fw-bold">{(mentor.name || 'M').charAt(0)}</span>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{mentor.name || 'Unknown'}</div>
                                                        <div className="small text-muted"><FaEnvelope className="me-1" size={10} />{mentor.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <Badge bg="info" className="bg-opacity-10 text-info fw-normal px-2 py-1 border border-info border-opacity-25">
                                                    <FaBook className="me-1" />
                                                    {mentor.subject || (Array.isArray(mentor.expertise) ? mentor.expertise[0] : mentor.expertise) || 'N/A'}
                                                </Badge>
                                            </td>
                                            <td className="py-3">
                                                <div className="text-warning d-flex align-items-center gap-1">
                                                    <FaStar /> <span className="text-dark fw-medium">{mentor.rating || '5.0'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                {mentor.status === 'Active' ?
                                                    <Badge bg="success" className="bg-opacity-10 text-success px-3 py-1 rounded-pill">Active</Badge> :
                                                    <Badge bg="danger" className="bg-opacity-10 text-danger px-3 py-1 rounded-pill">Suspended</Badge>
                                                }
                                            </td>
                                            <td className="pe-4 py-3 text-end">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <Button variant="outline-primary" size="sm" className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="Edit" onClick={() => handleOpenModal(mentor)}>
                                                        <FaEdit size={12} />
                                                    </Button>
                                                    {mentor.status === 'Active' ? (
                                                        <Button variant="outline-warning" size="sm" className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="Suspend" onClick={() => toggleStatus(mentor.id, mentor.status)}>
                                                            <FaPause size={12} />
                                                        </Button>
                                                    ) : (
                                                        <Button variant="outline-success" size="sm" className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="Activate" onClick={() => toggleStatus(mentor.id, mentor.status)}>
                                                            <FaPlay size={12} />
                                                        </Button>
                                                    )}
                                                    <Button variant="outline-danger" size="sm" className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="Delete" onClick={() => handleDelete(mentor.id)}>
                                                        <FaTrash size={12} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5">
                                            <div className="text-muted mb-3">No mentors found matching "{searchTerm}"</div>
                                            {searchTerm && <Button variant="outline-primary" onClick={() => setSearchTerm('')}>Clear Search</Button>}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>

                {/* Add/Edit Mentor Modal */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                    <Modal.Header closeButton className="border-0">
                        <Modal.Title className="fw-bold">{editMode ? 'Edit Mentor' : 'Add New Mentor'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Full Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Dr. John Doe"
                                    value={currentMentor.name}
                                    onChange={(e) => setCurrentMentor({ ...currentMentor, name: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Email Address</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="e.g. john@mentor.com"
                                    value={currentMentor.email}
                                    onChange={(e) => setCurrentMentor({ ...currentMentor, email: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Expertise / Subject</Form.Label>
                                <Form.Select
                                    value={currentMentor.subject || (Array.isArray(currentMentor.expertise) ? currentMentor.expertise[0] : currentMentor.expertise)}
                                    onChange={(e) => setCurrentMentor({ ...currentMentor, subject: e.target.value })}
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveMentor} disabled={submitting}>
                            {submitting ? <Spinner size="sm" /> : (editMode ? 'Save Changes' : 'Add Mentor')}
                        </Button>
                    </Modal.Footer>
                </Modal>

            </Container>
        </DashboardLayout>
    );
};


export default ManageMentors;
