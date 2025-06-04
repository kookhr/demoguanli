import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navigation from './components/Navigation'
import MinimalEnvironmentList from './components/MinimalEnvironmentList'
import './App.css'

// 最小化测试组件
const TestComponent = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900">测试页面</h1>
      <p className="text-gray-600 mt-4">如果您能看到这个页面，说明基础 React 正常工作。</p>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/test" element={<TestComponent />} />
          <Route path="/" element={<MinimalEnvironmentList />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
