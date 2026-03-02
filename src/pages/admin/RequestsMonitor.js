import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, Container, Spinner, InputGroup, FormControl } from 'react-bootstrap';
import { FaEye, FaCalendarAlt, FaFilter, FaCheckCircle, FaClock, FaSearch, FaTrash } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { db } from '../../firebase';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';

const RequestsMonitor = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, "requests"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(reqs);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching requests:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this request record?")) return;
        try {
            await deleteDoc(doc(db, "requests", id));
        } catch (error) {
            console.error("Error deleting request:", error);
            alert("Failed to delete request.");
        }
    };

    // Filter Logic
    const filteredRequests = requests.filter(req => {
        const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
        const matchesDate = dateFilter === '' || (req.timestamp && new Date(req.timestamp.seconds * 1000).toISOString().split('T')[0] === dateFilter);
        const matchesSearch = (req.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (req.mentorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (req.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesDate && matchesSearch;
    });

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
                        <h2 className="fw-bold mb-1" style={{ color: '#2c3e50' }}>Platform Requests</h2>
                        <p className="text-muted mb-0">Monitor and manage student-mentor connection requests.</p>
                    </div>
                    <div className="w-100 w-md-auto">
                        <InputGroup className="shadow-sm" style={{ maxWidth: '300px' }}>
                            <InputGroup.Text className="bg-white border-end-0 text-muted"><FaSearch /></InputGroup.Text>
                            <FormControl
                                placeholder="Search student, mentor, or subject..."
                                className="border-start-0 ps-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                </div>

                <div className="bg-white p-3 rounded-3 shadow-sm mb-4 border d-flex flex-wrap gap-3 align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <FaFilter className="text-muted" /> <span className="fw-medium text-dark">Filters:</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <Form.Select
                            size="sm"
                            className="border-gray-200 shadow-none"
                            style={{ minWidth: '150px' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                        </Form.Select>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <Form.Control
                            type="date"
                            size="sm"
                            className="border-gray-200 shadow-none"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    {(statusFilter !== 'All' || dateFilter !== '' || searchTerm !== '') && (
                        <Button variant="link" size="sm" className="text-decoration-none text-danger" onClick={() => { setStatusFilter('All'); setDateFilter(''); setSearchTerm(''); }}>
                            Clear Filters
                        </Button>
                    )}
                </div>

                <Card className="shadow-sm border-0 overflow-hidden" style={{ borderRadius: '15px' }}>
                    <Card.Body className="p-0">
                        <Table responsive hover className="align-middle mb-0">
                            <thead className="bg-light text-secondary">
                                <tr>
                                    <th className="ps-4 py-3 border-0">Student</th>
                                    <th className="py-3 border-0">Mentor</th>
                                    <th className="py-3 border-0">Subject</th>
                                    <th className="py-3 border-0">Date</th>
                                    <th className="py-3 border-0">Status</th>
                                    <th className="pe-4 py-3 border-0 text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.length > 0 ? (
                                    filteredRequests.map((req) => (
                                        <tr key={req.id} className="border-bottom">
                                            <td className="ps-4 py-3 fw-medium">{req.studentName}</td>
                                            <td className="py-3">
                                                {req.mentorName ? (
                                                    <span className="text-primary fw-medium">{req.mentorName}</span>
                                                ) : (
                                                    <span className="text-muted fst-italic">Not Assigned</span>
                                                )}
                                            </td>
                                            <td className="py-3"><Badge bg="light" text="dark" className="border">{req.subject}</Badge></td>
                                            <td className="py-3 text-muted"><FaCalendarAlt className="me-1 sm-icon" /> {req.timestamp ? new Date(req.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                            <td className="py-3">
                                                {req.status === 'Completed' && <Badge bg="success" className="bg-opacity-10 text-success px-3 py-1 rounded-pill d-inline-flex align-items-center gap-1"><FaCheckCircle size={10} /> Completed</Badge>}
                                                {req.status === 'Accepted' && <Badge bg="info" className="bg-opacity-10 text-info px-3 py-1 rounded-pill">Accepted</Badge>}
                                                {req.status === 'Pending' && <Badge bg="warning" className="bg-opacity-10 text-warning px-3 py-1 rounded-pill d-inline-flex align-items-center gap-1"><FaClock size={10} /> Pending</Badge>}
                                                {req.status === 'Rejected' && <Badge bg="danger" className="bg-opacity-10 text-danger px-3 py-1 rounded-pill">Rejected</Badge>}
                                            </td>
                                            <td className="pe-4 py-3 text-end">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <Button variant="outline-primary" size="sm" className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                        <FaEye size={12} />
                                                    </Button>
                                                    <Button variant="outline-danger" size="sm" className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} onClick={() => handleDelete(req.id)}>
                                                        <FaTrash size={12} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <div className="text-muted mb-3">No requests found matching filters</div>
                                            <Button variant="outline-primary" size="sm" onClick={() => { setStatusFilter('All'); setDateFilter(''); setSearchTerm(''); }}>Reset Filters</Button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </Container>
        </DashboardLayout>
    );
};

export default RequestsMonitor;

