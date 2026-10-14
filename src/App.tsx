import { Routes, Route } from 'react-router'
import SetupPage from '@/pages/SetupPage'
import LotteryPage from '@/pages/LotteryPage'
import RecordsPage from '@/pages/RecordsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SetupPage />} />
      <Route path="/lottery" element={<LotteryPage />} />
      <Route path="/records" element={<RecordsPage />} />
    </Routes>
  )
}

export default App
