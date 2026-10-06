import { HashRouter, Routes, Route } from 'react-router-dom'
import Shell from './components/Shell'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Candidates from './pages/Candidates'
import Voters from './pages/Voters'
import Tps from './pages/Tps'
import Results from './pages/Results'
import TpsDesk from './pages/TpsDesk'
import Vote from './pages/Vote'

export default function App(){
  return <HashRouter><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/admin" element={<Shell/>}>
      <Route index element={<Dashboard/>}/>
      <Route path="candidates" element={<Candidates/>}/>
      <Route path="voters" element={<Voters/>}/>
      <Route path="tps" element={<Tps/>}/>
      <Route path="results" element={<Results/>}/>
    </Route>
    <Route path="/tps/:id" element={<TpsDesk/>}/>
    <Route path="/vote" element={<Vote/>}/>
  </Routes></HashRouter>
}
