import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages/components
// import Home from './pages/Home';
// import About from './pages/About';
// import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Attendance RAK</h1>
        </header>
        
        <main className="App-main">
          <Routes>
            {/* Define your routes here */}
            {/* <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} /> */}
            
            {/* Placeholder route */}
            <Route path="/" element={
              <div className="welcome-container">
                <h2>Welcome to Attendance RAK</h2>
                <p>Configure your routes in App.js</p>
              </div>
            } />
          </Routes>
        </main>
        
        <footer className="App-footer">
          <p>&copy; 2026 Attendance RAK. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
