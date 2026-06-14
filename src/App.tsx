import { Routes, Route, Navigate } from 'react-router-dom';
import WorldEditor from './pages/WorldEditor';

function App() {
  return (
    <Routes>
      <Route path="/editor" element={<WorldEditor />} />
      <Route path="/characters" element={<div style={{color:'#fff',padding:20}}>Characters (Phase 2)</div>} />
      <Route path="/systems" element={<div style={{color:'#fff',padding:20}}>Systems (Phase 2)</div>} />
      <Route path="/timeline" element={<div style={{color:'#fff',padding:20}}>Timeline (Phase 2)</div>} />
      <Route path="*" element={<Navigate to="/editor" replace />} />
    </Routes>
  );
}
export default App;
