import { useState } from 'react'
import MapView from './components/Map/MapView'
import './App.css'

function App() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  return (
    <div className="urbanpulse-app">
      <header className="app-header">
        <div className="brand-container">
          <div className="brand-logo-badge">UP</div>
          <div className="brand-titles">
            <h1 className="brand-title">UrbanPulse</h1>
            <p className="brand-subtitle">
              Civic issue reports and community events around you
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-report-header"
          onClick={() => setIsReportModalOpen(true)}
        >
          + Report an Issue
        </button>
      </header>

      <main className="app-main">
        <MapView
          isReportModalOpen={isReportModalOpen}
          setIsReportModalOpen={setIsReportModalOpen}
        />
      </main>

      <footer className="app-footer">
        <p>UrbanPulse V1 • Interactive Map Foundation</p>
      </footer>
    </div>
  )
}

export default App
