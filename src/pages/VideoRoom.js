import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Container } from 'react-bootstrap';
import { FaSignOutAlt } from 'react-icons/fa';

const VideoRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const jitsiContainerRef = useRef(null);

    useEffect(() => {
        // Load Jitsi script
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {
            const domain = 'meet.jit.si';
            const options = {
                roomName: roomId,
                width: '100%',
                height: '600px',
                parentNode: jitsiContainerRef.current,
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                        'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                        'security'
                    ],
                },
                configOverwrite: {
                    disableThirdPartyRequests: true,
                    prejoinPageEnabled: false
                }
            };
            const api = new window.JitsiMeetExternalAPI(domain, options);

            api.addEventListener('videoConferenceLeft', () => {
                navigate(-1);
            });
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [roomId, navigate]);

    return (
        <Container fluid className="vh-100 d-flex flex-column p-0 bg-dark">
            <div className="d-flex justify-content-between align-items-center p-3 text-white border-bottom border-secondary">
                <h4 className="mb-0 fw-bold">Session: {roomId}</h4>
                <Button variant="danger" size="sm" onClick={() => navigate(-1)}>
                    <FaSignOutAlt className="me-2" /> Exit Room
                </Button>
            </div>
            <div ref={jitsiContainerRef} style={{ flex: 1 }} />
        </Container>
    );
};

export default VideoRoom;
