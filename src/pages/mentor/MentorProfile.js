import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaUser } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { db, auth, storage } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

const MentorProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        bio: '',
        experience: '',
        photoURL: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const docRef = doc(db, "mentors", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const nameParts = (data.name || '').split(' ');
                        setFormData({
                            firstName: data.firstName || nameParts[0] || '',
                            lastName: data.lastName || nameParts.slice(1).join(' ') || '',
                            bio: data.bio || '',
                            experience: data.experience || '',
                            photoURL: data.photoURL || ''
                        });
                        setImagePreview(data.photoURL || '');
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                    setMessage({ type: 'danger', text: 'Failed to load profile data.' });
                } finally {
                    setLoading(false);
                }
            } else {
                navigate('/mentor/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const uploadImage = () => {
        return new Promise((resolve, reject) => {
            if (!imageFile) return resolve(formData.photoURL);

            setUploading(true);
            const storageRef = ref(storage, `mentors/${user.uid}/profile_${Date.now()}`);
            const uploadTask = uploadBytesResumable(storageRef, imageFile);

            // Add a timeout of 30 seconds
            const timeout = setTimeout(() => {
                uploadTask.cancel();
                setUploading(false);
                reject(new Error("Upload timed out. Please check your internet connection or Firebase Storage rules."));
            }, 30000);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    clearTimeout(timeout);
                    console.error("Upload error:", error);
                    setUploading(false);
                    reject(error);
                },
                () => {
                    clearTimeout(timeout);
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        setUploading(false);
                        resolve(downloadURL);
                    }).catch((error) => {
                        setUploading(false);
                        reject(error);
                    });
                }
            );
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const photoURL = await uploadImage();
            const docRef = doc(db, "mentors", user.uid);
            await setDoc(docRef, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                bio: formData.bio,
                experience: formData.experience,
                photoURL: photoURL
            }, { merge: true });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: 'danger', text: 'Failed to update profile: ' + error.message });
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
            <Row className="justify-content-center">
                <Col md={8}>
                    {message.text && <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>{message.text}</Alert>}
                    <Card className="shadow border-0">
                        <Card.Header className="bg-white p-4 pb-0 border-bottom-0">
                            <h3 className="fw-bold">Edit Mentor Profile</h3>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <Form onSubmit={handleSubmit}>
                                <div className="text-center mb-4">
                                    <div className="position-relative d-inline-block">
                                        <div
                                            className="rounded-circle shadow d-flex align-items-center justify-content-center bg-light overflow-hidden"
                                            style={{ width: '150px', height: '150px', border: '5px solid white' }}
                                        >
                                            {imagePreview ? (
                                                <img
                                                    src={imagePreview}
                                                    alt="Profile Preview"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <FaUser className="text-secondary" style={{ fontSize: '80px' }} />
                                            )}
                                        </div>
                                        <Form.Label
                                            htmlFor="photoUpload"
                                            className="btn btn-primary btn-sm rounded-circle position-absolute bottom-0 end-0 mb-2 me-2 shadow-sm d-flex align-items-center justify-content-center"
                                            style={{ width: '40px', height: '40px', cursor: 'pointer' }}
                                        >
                                            <FaCamera style={{ fontSize: '18px' }} />
                                            <input
                                                type="file"
                                                id="photoUpload"
                                                accept="image/*"
                                                className="d-none"
                                                onChange={handleImageChange}
                                            />
                                        </Form.Label>
                                    </div>
                                    <p className="mt-2 text-muted small fw-bold">Click camera to upload photo</p>
                                    {uploading && (
                                        <div className="mt-2" style={{ maxWidth: '200px', margin: '0 auto' }}>
                                            <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                                                <div
                                                    className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                                                    role="progressbar"
                                                    style={{ width: `${uploadProgress}%` }}
                                                ></div>
                                            </div>
                                            <small className="text-success fw-bold">Uploading... {Math.round(uploadProgress)}%</small>
                                        </div>
                                    )}
                                </div>
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group controlId="firstName">
                                            <Form.Label>First Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="lastName">
                                            <Form.Label>Last Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3" controlId="bio">
                                    <Form.Label>Bio (Tell students about yourself)</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="experience">
                                    <Form.Label>Experience & Qualifications</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={formData.experience}
                                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    />
                                </Form.Group>


                                <div className="text-end">
                                    <Button variant="primary" type="submit" disabled={saving || uploading}>
                                        {(saving || uploading) ? <Spinner size="sm" className="me-2" /> : null}
                                        {uploading ? 'Uploading Image...' : 'Save Profile'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </DashboardLayout>
    );
};

export default MentorProfile;
