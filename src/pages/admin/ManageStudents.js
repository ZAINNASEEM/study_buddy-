import React, { useState, useEffect } from 'react';
import { Card, Table, Button, FormControl, InputGroup, Badge, Container, Modal, Form, Spinner } from 'react-bootstrap';
import { FaSearch, FaBan, FaUnlock, FaUserPlus, FaTrash, FaEnvelope, FaCalendarAlt, FaEdit } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';

const ManageStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentStudent, setCurrentStudent] = useState({ id: '', name: '', email: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, "users"), where("role", "==", "student"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const studentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(studentData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter
    const filteredStudents = students.filter(student =>
        (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handlers
    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
        try {
            await updateDoc(doc(db, "users", id), { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this student? This cannot be undone.')) {
            try {
                await deleteDoc(doc(db, "users", id));
            } catch (error) {
                console.error("Error deleting student:", error);
                alert("Failed to delete student");
            }
        }
    };

    const handleOpenModal = (student = { id: '', name: '', email: '' }) => {
        setCurrentStudent(student);
        setEditMode(!!student.id);
        setShowModal(true);
    };

    const handleSaveStudent = async () => {
        if (!currentStudent.name || !currentStudent.email) {
            alert("Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            if (editMode) {
                await updateDoc(doc(db, "users", currentStudent.id), {
                    name: currentStudent.name,
                    email: currentStudent.email,
                    updatedAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, "users"), {
                    name: currentStudent.name,
                    email: currentStudent.email,
                    role: 'student',
                    status: 'Active',
                    joined: new Date().toISOString().split('T')[0],
                    createdAt: serverTimestamp()
                });
            }
            setShowModal(false);
        } catch (error) {
            console.error("Error saving student:", error);
            alert("Failed to save student.");
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
                        <h2 className="fw-bold mb-1" style={{ color: '#2c3e50' }}>Manage Students</h2>
                        <p className="text-muted mb-0">Track and manage student access.</p>
                    </div>
                    <div className="d-flex gap-2 w-100 w-md-auto">
                        <InputGroup className="shadow-sm" style={{ maxWidth: '300px' }}>
                            <InputGroup.Text className="bg-white border-end-0 text-muted"><FaSearch /></InputGroup.Text>
                            <FormControl
                                placeholder="Search students..."
                                className="border-start-0 ps-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </InputGroup>
                        <Button variant="primary" className="shadow-sm d-flex align-items-center gap-2 px-3" onClick={() => handleOpenModal()}>
                            <FaUserPlus /> <span className="d-none d-sm-inline">Add Student</span>
                        </Button>
                    </div>
                </div>

                <Card className="shadow-sm border-0 overflow-hidden" style={{ borderRadius: '15px' }}>
                    <Card.Body className="p-0">
                        <Table responsive hover className="align-middle mb-0">
                            <thead className="bg-light text-secondary">
                                <tr>
                                    <th className="ps-4 py-3 border-0">Student</th>
                                    <th className="py-3 border-0">Joined Date</th>
                                    <th className="py-3 border-0">Status</th>
                                    <th className="pe-4 py-3 border-0 text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id} className="border-bottom">
                                            <td className="ps-4 py-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                                        <span className="fw-bold">{(student.name || 'U').charAt(0)}</span>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{student.name || 'Unknown'}</div>
                                                        <div className="small text-muted"><FaEnvelope className="me-1" size={10} />{student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-muted"><FaCalendarAlt className="me-1 sm-icon" /> {student.joined || 'N/A'}</span>
                                            </td>
                                            <td className="py-3">
                                                {student.status === 'Active' ?
                                                    <Badge bg="success" className="bg-opacity-10 text-success px-3 py-1 rounded-pill">Active</Badge> :
                                                    <Badge bg="danger" className="bg-opacity-10 text-danger px-3 py-1 rounded-pill">Blocked</Badge>
                                                }
                                            </td>
                                            <td className="pe-4 py-3 text-end">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <Button variant="outline-primary" size="sm" className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="Edit" onClick={() => handleOpenModal(student)}>
                                                        <FaEdit size={12} />
                                                    </Button>
                                                    {student.status === 'Active' ? (
                                                        <Button variant="outline-danger" size="sm" className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="Block" onClick={() => toggleStatus(student.id, student.status)}>
                                                            <FaBan size={12} />
                                                        </Button>
                                                    ) : (
                                                        <Button variant="outline-success" size="sm" className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="Unblock" onClick={() => toggleStatus(student.id, student.status)}>
                                                            <FaUnlock size={12} />
                                                        </Button>
                                                    )}
                                                    <Button variant="outline-danger" size="sm" className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="Delete" onClick={() => handleDelete(student.id)}>
                                                        <FaTrash size={12} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-5">
                                            <div className="text-muted mb-3">No students found matching "{searchTerm}"</div>
                                            {searchTerm && <Button variant="outline-primary" onClick={() => setSearchTerm('')}>Clear Search</Button>}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>

                {/* Add/Edit Student Modal */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                    <Modal.Header closeButton className="border-0">
                        <Modal.Title className="fw-bold">{editMode ? 'Edit Student' : 'Add New Student'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Full Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Jane Doe"
                                    value={currentStudent.name}
                                    onChange={(e) => setCurrentStudent({ ...currentStudent, name: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Email Address</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="e.g. jane@student.com"
                                    value={currentStudent.email}
                                    onChange={(e) => setCurrentStudent({ ...currentStudent, email: e.target.value })}
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveStudent} disabled={submitting}>
                            {submitting ? <Spinner size="sm" /> : (editMode ? 'Save Changes' : 'Add Student')}
                        </Button>
                    </Modal.Footer>
                </Modal>

            </Container>
        </DashboardLayout>
    );
};

export default ManageStudents;
