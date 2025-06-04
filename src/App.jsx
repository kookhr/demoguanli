import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import TestPage from './components/TestPage'
import EnvironmentList from './components/EnvironmentList'
import SimpleEnvironmentList from './components/SimpleEnvironmentList'
import ConfigPage from './components/ConfigPage'
import Navigation from './components/Navigation'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/test" element={<TestPage />} />
          <Route path="/simple" element={<SimpleEnvironmentList />} />
          <Route path="/" element={<SimpleEnvironmentList />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
