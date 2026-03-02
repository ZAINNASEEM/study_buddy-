import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, InputGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { FaPaperPlane, FaChevronLeft, FaUserCircle } from 'react-icons/fa';

const Chat = () => {
    const { mentorId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [mentor, setMentor] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                navigate('/student/login');
                return;
            }
            setUser(currentUser);

            // Fetch mentor details for name
            try {
                const mentorDoc = await getDoc(doc(db, "users", mentorId));
                if (mentorDoc.exists()) {
                    setMentor(mentorDoc.data());
                } else {
                    console.error("Mentor not found");
                }
            } catch (err) {
                console.error("Error fetching mentor:", err);
            }

            // Chat identifier: combination of student (user.uid) and mentor (mentorId)
            const chatId = [currentUser.uid, mentorId].sort().join('_');

            const q = query(
                collection(db, "messages"),
                where("chatId", "==", chatId)
            );

            const unsubscribeMessages = onSnapshot(q, (snapshot) => {
                const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Sort client-side to avoid index requirements
                msgs.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
                setMessages(msgs);
                setLoading(false);
                setTimeout(scrollToBottom, 100);
            }, (error) => {
                console.error("Chat listener error:", error);
                setLoading(false); // Stop loading even if error
            });

            return () => unsubscribeMessages();
        });

        return () => unsubscribeAuth();
    }, [mentorId, navigate]);

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const chatId = [user.uid, mentorId].sort().join('_');

        try {
            await addDoc(collection(db, "messages"), {
                chatId,
                senderId: user.uid,
                receiverId: mentorId,
                text: newMessage,
                createdAt: serverTimestamp(),
                senderName: user.displayName || 'Student'
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" style={{ color: 'var(--primary-purple)' }} />
            </div>
        );
    }

    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow-lg border-0 rounded-4 overflow-hidden chat-card">
                        <Card.Header className="bg-gradient-purple text-white p-3 d-flex align-items-center gap-3">
                            <Button variant="link" className="text-white p-0" onClick={() => navigate(-1)}>
                                <FaChevronLeft />
                            </Button>
                            <div className="bg-white rounded-circle d-flex align-items-center justify-content-center text-purple" style={{ width: '40px', height: '40px' }}>
                                <FaUserCircle size={30} />
                            </div>
                            <div>
                                <h5 className="mb-0 fw-bold">{mentor?.name || 'Mentor'}</h5>
                                <small className="opacity-75">Online</small>
                            </div>
                        </Card.Header>

                        <Card.Body className="p-0 d-flex flex-column" style={{ height: '500px' }}>
                            <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3">
                                {messages.length === 0 ? (
                                    <div className="text-center text-muted my-auto">
                                        <p>No messages yet. Say hi!</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`d-flex ${msg.senderId === user?.uid ? 'justify-content-end' : 'justify-content-start'}`}
                                        >
                                            <div
                                                className={`p-3 rounded-4 shadow-sm ${msg.senderId === user?.uid
                                                    ? 'bg-primary text-white'
                                                    : 'bg-light text-dark'
                                                    }`}
                                                style={{ maxWidth: '80%', wordBreak: 'break-word' }}
                                            >
                                                {msg.text}
                                                <div className={`small opacity-75 mt-1 text-end`} style={{ fontSize: '0.7rem' }}>
                                                    {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <Card.Footer className="bg-white border-top-0 p-3">
                                <Form onSubmit={handleSendMessage}>
                                    <InputGroup>
                                        <Form.Control
                                            placeholder="Type your message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            className="rounded-pill-start border-2 border-light py-2 px-3 focus-none"
                                            style={{ boxShadow: 'none' }}
                                        />
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="rounded-pill-end px-4 d-flex align-items-center"
                                            disabled={!newMessage.trim()}
                                        >
                                            <FaPaperPlane />
                                        </Button>
                                    </InputGroup>
                                </Form>
                            </Card.Footer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <style>{`
                .bg-gradient-purple { background: var(--gradient-purple) !important; }
                .text-purple { color: var(--primary-purple) !important; }
                .focus-none:focus { border-color: var(--primary-purple) !important; }
                .rounded-pill-start { border-top-left-radius: 25px; border-bottom-left-radius: 25px; }
                .rounded-pill-end { border-top-right-radius: 25px; border-bottom-right-radius: 25px; }
            `}</style>
        </Container>
    );
};

export default Chat;
