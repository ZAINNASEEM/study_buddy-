import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, ListGroup, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { FaTrash, FaEdit, FaPlus, FaSearch } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { db } from '../../firebase';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { InputGroup, FormControl } from 'react-bootstrap';

const ManageSubjects = () => {

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentSubject, setCurrentSubject] = useState({ id: '', name: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');


    useEffect(() => {
        const q = query(collection(db, "subjects"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const subjectData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort alphabetically
            subjectData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setSubjects(subjectData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching subjects:", err);
            setError("Failed to load subjects.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredSubjects = subjects.filter(sub =>
        (sub.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (subject = { id: '', name: '' }) => {
        setCurrentSubject(subject);
        setEditMode(!!subject.id);
        setShowModal(true);
        setError('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentSubject({ id: '', name: '' });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentSubject.name.trim()) return;

        setSubmitting(true);
        setError('');

        try {
            if (editMode) {
                await updateDoc(doc(db, "subjects", currentSubject.id), {
                    name: currentSubject.name.trim(),
                    updatedAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, "subjects"), {
                    name: currentSubject.name.trim(),
                    createdAt: serverTimestamp()
                });
            }
            handleCloseModal();
        } catch (err) {
            console.error("Error saving subject:", err);
            setError("Failed to save subject. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this subject?")) return;

        try {
            await deleteDoc(doc(db, "subjects", id));
        } catch (err) {
            console.error("Error deleting subject:", err);
            alert("Failed to delete subject.");
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
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: '15px' }}>
                        <Card.Header className="bg-white d-flex flex-column flex-md-row justify-content-between align-items-md-center p-4 border-0 gap-3">
                            <h4 className="fw-bold mb-0" style={{ color: '#2c3e50' }}>Manage Subjects</h4>
                            <div className="d-flex gap-2">
                                <InputGroup className="shadow-sm" style={{ maxWidth: '250px' }}>
                                    <InputGroup.Text className="bg-white border-end-0 text-muted"><FaSearch /></InputGroup.Text>
                                    <FormControl
                                        placeholder="Search..."
                                        className="border-start-0 ps-0"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                                <Button
                                    variant="primary"
                                    className="shadow-sm d-flex align-items-center gap-2"
                                    onClick={() => handleOpenModal()}
                                >
                                    <FaPlus /> Add New
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {error && <Alert variant="danger" className="m-3">{error}</Alert>}
                            <ListGroup variant="flush">
                                {filteredSubjects.length > 0 ? (
                                    filteredSubjects.map((sub) => (
                                        <ListGroup.Item key={sub.id} className="d-flex justify-content-between align-items-center p-3 border-light">
                                            <span className="fw-medium text-dark ps-3">{sub.name}</span>
                                            <div className="pe-3">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="me-2 rounded-circle p-2 d-inline-flex align-items-center justify-content-center"
                                                    style={{ width: '32px', height: '32px' }}
                                                    onClick={() => handleOpenModal(sub)}
                                                >
                                                    <FaEdit size={12} />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    className="rounded-circle p-2 d-inline-flex align-items-center justify-content-center"
                                                    style={{ width: '32px', height: '32px' }}
                                                    onClick={() => handleDelete(sub.id)}
                                                >
                                                    <FaTrash size={12} />
                                                </Button>
                                            </div>
                                        </ListGroup.Item>
                                    ))
                                ) : (
                                    <div className="text-center py-5 text-muted">
                                        {searchTerm ? `No subjects found matching "${searchTerm}"` : 'No subjects found. Add some to get started!'}
                                    </div>
                                )}
                            </ListGroup>

                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">{editMode ? 'Edit Subject' : 'Add New Subject'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>Subject Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g. Mathematics"
                                value={currentSubject.name}
                                onChange={(e) => setCurrentSubject({ ...currentSubject, name: e.target.value })}
                                required
                                autoFocus
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="light" onClick={handleCloseModal}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={submitting}>
                            {submitting ? <Spinner size="sm" animation="border" /> : (editMode ? 'Save Changes' : 'Add Subject')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </DashboardLayout>
    );
};

export default ManageSubjects;
