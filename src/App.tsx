/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Publications } from './pages/Publications';
import { Submissions } from './pages/Submissions';
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';
import { BookDetails } from './pages/BookDetails';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/publicacoes" element={<Publications />} />
        <Route path="/submissoes" element={<Submissions />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        
        {/* Support both /book/:id and localized /livro/:id */}
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="/livro/:id" element={<BookDetails />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
