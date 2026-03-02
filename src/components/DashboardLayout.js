import React from 'react';
import { Container } from 'react-bootstrap';
import Sidebar from './Sidebar';

const DashboardLayout = ({ role, children }) => {
    return (
        <div className="dashboard-container">
            <Sidebar role={role} />
            <div className="main-content">
                <Container fluid>
                    {children}
                </Container>
            </div>
        </div>
    );
};

export default DashboardLayout;
