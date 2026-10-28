import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.jsx';
import { Footer } from '../components/Footer.jsx';
import { CreateUrlModal } from '../components/CreateUrlModal.jsx';

export const MainLayout = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenCreateModal={() => setCreateModalOpen(true)} />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />

      <CreateUrlModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          // If on dashboard, event will propagate or user can refresh
        }}
      />
    </div>
  );
};
