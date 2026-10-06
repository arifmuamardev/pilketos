import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RequireAuth from './components/RequireAuth'
import Shell from './components/Shell'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Candidates from './pages/Candidates'
import Voters from './pages/Voters'
import Tps from './pages/Tps'
import Results from './pages/Results'
import Staff from './pages/Staff'
import ElectionSetup from './pages/ElectionSetup'
import TpsDesk from './pages/TpsDesk'
import Vote from './pages/Vote'

export default function App(){
  return <AuthProvider><HashRouter><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/admin" element={<RequireAuth roles={['admin']}><Shell/></RequireAuth>}>
      <Route index element={<Dashboard/>}/>
      <Route path="candidates" element={<Candidates/>}/>
      <Route path="voters" element={<Voters/>}/>
      <Route path="tps" element={<Tps/>}/>
      <Route path="results" element={<Results/>}/>
      <Route path="staff" element={<Staff/>}/>
      <Route path="election" element={<ElectionSetup/>}/>
    </Route>
    <Route path="/tps/:id" element={<RequireAuth roles={['admin','officer']}><TpsDesk/></RequireAuth>}/>
    <Route path="/vote" element={<Vote/>}/>
  </Routes></HashRouter></AuthProvider>
}
