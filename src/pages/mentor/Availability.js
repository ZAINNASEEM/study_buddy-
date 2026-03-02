import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table, Spinner, Alert } from 'react-bootstrap';
import { FaTrash, FaPlus } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Availability = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [user, setUser] = useState(null);

    const [subjects, setSubjects] = useState([]);
    const [newSubject, setNewSubject] = useState({ name: '', fee: '' });

    const [schedule, setSchedule] = useState({
        Mon: { available: true, from: '09:00', to: '17:00' },
        Tue: { available: true, from: '09:00', to: '17:00' },
        Wed: { available: true, from: '09:00', to: '17:00' },
        Thu: { available: true, from: '09:00', to: '17:00' },
        Fri: { available: true, from: '09:00', to: '17:00' },
        Sat: { available: false, from: '09:00', to: '17:00' },
        Sun: { available: false, from: '09:00', to: '17:00' }
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const docRef = doc(db, "mentors", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.subjects) setSubjects(data.subjects);
                        if (data.schedule) setSchedule(data.schedule);
                    }
                } catch (error) {
                    console.error("Error fetching availability:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                navigate('/mentor/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!newSubject.name || !newSubject.fee) return;

        const updatedSubjects = [...subjects, { ...newSubject, id: Date.now() }];
        setSubjects(updatedSubjects);
        setNewSubject({ name: '', fee: '' });
        await updateFirestore({ subjects: updatedSubjects });
    };

    const handleRemoveSubject = async (id) => {
        const updatedSubjects = subjects.filter(s => s.id !== id);
        setSubjects(updatedSubjects);
        await updateFirestore({ subjects: updatedSubjects });
    };

    const handleScheduleChange = (day, field, value) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    const handleSaveSchedule = async () => {
        await updateFirestore({ schedule });
    };

    const updateFirestore = async (data) => {
        if (!user) return;
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await setDoc(doc(db, "mentors", user.uid), data, { merge: true });
            setMessage({ type: 'success', text: 'Availability updated!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error("Error updating Firestore:", error);
            setMessage({ type: 'danger', text: 'Failed to update.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="mentor">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="mentor">
            <h2 className="fw-bold mb-4">Subjects & Availability</h2>
            {message.text && <Alert variant={message.type} className="mb-4">{message.text}</Alert>}

            <Row>
                <Col md={6} className="mb-4 text-dark">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-white fw-bold">My Subjects & Fees</Card.Header>
                        <Card.Body>
                            <Form className="d-flex gap-2 mb-4" onSubmit={handleAddSubject}>
                                <Form.Control
                                    type="text"
                                    placeholder="Subject (e.g. React)"
                                    value={newSubject.name}
                                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                                    required
                                />
                                <Form.Control
                                    type="number"
                                    placeholder="Fee ($/hr)"
                                    style={{ maxWidth: '110px' }}
                                    value={newSubject.fee}
                                    onChange={(e) => setNewSubject({ ...newSubject, fee: e.target.value })}
                                    required
                                />
                                <Button type="submit" variant="primary" size="sm" className="d-flex align-items-center px-3">
                                    <FaPlus className="me-1" /> Add
                                </Button>
                            </Form>

                            <Table hover responsive size="sm" className="align-middle">
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Fee ($/hr)</th>
                                        <th className="text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.length > 0 ? (
                                        subjects.map((sub) => (
                                            <tr key={sub.id}>
                                                <td>{sub.name}</td>
                                                <td>${sub.fee}/hr</td>
                                                <td className="text-end">
                                                    <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveSubject(sub.id)}>
                                                        <FaTrash />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="text-center text-muted py-3">No subjects added yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} className="mb-4 text-dark">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-white fw-bold">Weekly Schedule</Card.Header>
                        <Card.Body>
                            <p className="text-muted small mb-4">Set your active teaching hours for each day of the week.</p>
                            {Object.keys(schedule).map((day) => (
                                <div key={day} className="mb-3 d-flex align-items-center gap-3">
                                    <div style={{ width: '40px' }} className="fw-bold">{day}</div>
                                    <Form.Check
                                        type="switch"
                                        id={`switch-${day}`}
                                        label=""
                                        checked={schedule[day].available}
                                        onChange={(e) => handleScheduleChange(day, 'available', e.target.checked)}
                                    />
                                    <div className="d-flex gap-2 align-items-center flex-grow-1">
                                        <Form.Control
                                            type="time"
                                            size="sm"
                                            value={schedule[day].from}
                                            disabled={!schedule[day].available}
                                            onChange={(e) => handleScheduleChange(day, 'from', e.target.value)}
                                        />
                                        <span className="text-muted small">to</span>
                                        <Form.Control
                                            type="time"
                                            size="sm"
                                            value={schedule[day].to}
                                            disabled={!schedule[day].available}
                                            onChange={(e) => handleScheduleChange(day, 'to', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                            <div className="text-end mt-4">
                                <Button variant="primary" onClick={handleSaveSchedule} disabled={saving}>
                                    {saving ? <Spinner size="sm" className="me-2" /> : null}
                                    Save Schedule
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <style>{`
                .form-switch .form-check-input {
                    cursor: pointer;
                    width: 2.5em;
                    height: 1.25em;
                }
                .form-switch .form-check-input:checked {
                    background-color: var(--primary-purple);
                    border-color: var(--primary-purple);
                }
            `}</style>
        </DashboardLayout>
    );
};

export default Availability;
