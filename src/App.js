import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';

// Auth Pages
import StudentLogin from './pages/auth/StudentLogin';
import StudentRegister from './pages/auth/StudentRegister';
import MentorLogin from './pages/auth/MentorLogin';
import MentorRegister from './pages/auth/MentorRegister';
import WaitingApproval from './pages/auth/WaitingApproval';
import AdminLogin from './pages/auth/AdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import CreateStudyRequest from './pages/student/CreateStudyRequest';
import SearchMentors from './pages/student/SearchMentors';
import MentorProfileView from './pages/student/MentorProfile';
import MyRequests from './pages/student/MyRequests';
import StudentProfile from './pages/student/StudentProfile';
import Chat from './pages/student/Chat';

// Mentor Pages
import MentorDashboard from './pages/mentor/MentorDashboard';
import MentorProfileEdit from './pages/mentor/MentorProfile';
import Availability from './pages/mentor/Availability';
import StudentRequests from './pages/mentor/StudentRequests';
import RequestDetails from './pages/mentor/RequestDetails';
import MentorSessions from './pages/mentor/MentorSessions';
import MentorSettings from './pages/mentor/MentorSettings';
import MentorChat from './pages/mentor/Chat';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import MentorApproval from './pages/admin/MentorApproval';
import ManageStudents from './pages/admin/ManageStudents';
import ManageMentors from './pages/admin/ManageMentors';
import ManageSubjects from './pages/admin/ManageSubjects';
import RequestsMonitor from './pages/admin/RequestsMonitor';
import Analytics from './pages/admin/Analytics';
import AdminSettings from './pages/admin/AdminSettings';

import VideoRoom from './pages/VideoRoom';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public & Student Routes (With Navbar & Footer) */}
        <Route element={<Layout><Outlet /></Layout>}>
          <Route path="/" element={<Home />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Auth Routes */}
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/register" element={<StudentRegister />} />
          <Route path="/mentor/login" element={<MentorLogin />} />
          <Route path="/mentor/register" element={<MentorRegister />} />
          <Route path="/mentor/waiting-approval" element={<WaitingApproval />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/create-request" element={<CreateStudyRequest />} />
          <Route path="/student/search-mentors" element={<SearchMentors />} />
          <Route path="/student/mentor/:id" element={<MentorProfileView />} />
          <Route path="/student/requests" element={<MyRequests />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/chat/:mentorId" element={<Chat />} />
        </Route>

        {/* Mentor Routes (With Sidebar, No Public Navbar) */}
        <Route path="/mentor/dashboard" element={<MentorDashboard />} />
        <Route path="/mentor/profile" element={<MentorProfileEdit />} />
        <Route path="/mentor/availability" element={<Availability />} />
        <Route path="/mentor/requests" element={<StudentRequests />} />
        <Route path="/mentor/request/:id" element={<RequestDetails />} />
        <Route path="/mentor/sessions" element={<MentorSessions />} />
        <Route path="/mentor/settings" element={<MentorSettings />} />
        <Route path="/mentor/chat/:studentId" element={<MentorChat />} />

        {/* Admin Routes (With Sidebar, No Public Navbar) */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/mentors/approval" element={<MentorApproval />} />
        <Route path="/admin/students" element={<ManageStudents />} />
        <Route path="/admin/mentors" element={<ManageMentors />} />
        <Route path="/admin/subjects" element={<ManageSubjects />} />
        <Route path="/admin/requests" element={<RequestsMonitor />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* Video Route */}
        <Route path="/video/:roomId" element={<VideoRoom />} />

        {/* 404 Route */}
        <Route path="*" element={<Layout><div className="container py-5 text-center"><h2>404</h2><p>Page Not Found</p></div></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
