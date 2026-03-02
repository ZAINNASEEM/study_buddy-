import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import {
    FaHome, FaUserGraduate, FaChalkboardTeacher, FaBook,
    FaClipboardList, FaChartLine, FaCog, FaSignOutAlt,
    FaCalendarAlt, FaUserEdit
} from 'react-icons/fa';

const Sidebar = ({ role }) => {
    const location = useLocation();

    // Define menu items based on role
    const adminMenu = [
        { path: '/admin/dashboard', icon: <FaHome />, label: 'Dashboard' },
        { path: '/admin/mentors/approval', icon: <FaChalkboardTeacher />, label: 'Approve Mentors' },
        { path: '/admin/students', icon: <FaUserGraduate />, label: 'Manage Students' },
        { path: '/admin/mentors', icon: <FaChalkboardTeacher />, label: 'Manage Mentors' },
        { path: '/admin/subjects', icon: <FaBook />, label: 'Manage Subjects' },
        { path: '/admin/requests', icon: <FaClipboardList />, label: 'Monitor Requests' },
        { path: '/admin/analytics', icon: <FaChartLine />, label: 'Analytics' },
        { path: '/admin/settings', icon: <FaCog />, label: 'Settings' },
    ];

    const mentorMenu = [
        { path: '/mentor/dashboard', icon: <FaHome />, label: 'Dashboard' },
        { path: '/mentor/requests', icon: <FaClipboardList />, label: 'Student Requests' },
        { path: '/mentor/sessions', icon: <FaCalendarAlt />, label: 'My Sessions' },
        { path: '/mentor/availability', icon: <FaClipboardList />, label: 'Availability' },
        { path: '/mentor/profile', icon: <FaUserEdit />, label: 'Edit Profile' },
        { path: '/mentor/settings', icon: <FaCog />, label: 'Settings' },
    ];

    const menuItems = role === 'admin' ? adminMenu : mentorMenu;

    return (
        <div className="sidebar d-flex flex-column flex-shrink-0 p-3 shadow-sm">
            <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-decoration-none sidebar-logo">
                <span className="fs-4 fw-bold text-gradient">{role === 'admin' ? 'Admin Panel' : 'Mentor Panel'}</span>
            </a>
            <hr />
            <Nav className="flex-column mb-auto">
                {menuItems.map((item, index) => (
                    <Nav.Item key={index} className="mb-1">
                        <Nav.Link
                            as={Link}
                            to={item.path}
                            className={`d-flex align-items-center gap-2 px-3 py-2 rounded ${location.pathname === item.path ? 'active-link' : ''}`}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            {item.label}
                        </Nav.Link>
                    </Nav.Item>
                ))}
            </Nav>
            <hr />
            <div className="dropdown mt-auto">
                <Link to="/" className="d-flex align-items-center text-decoration-none gap-2 text-dark px-3 py-2 rounded hover-bg-light">
                    <FaSignOutAlt className="text-danger" />
                    <strong>Sign out</strong>
                </Link>
            </div>
        </div>
    );
};

export default Sidebar;
