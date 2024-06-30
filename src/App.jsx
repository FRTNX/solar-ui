import { useState, useEffect } from 'react';
import { initDefault } from './api/solar-api';

import { RingLoader } from 'react-spinners';

import Dashboard from './Dashboard';
import SimulationTimeSlider from './SimulationTimeSlider';
import SolarArrayOutput from './SolarArrayOutput';
import Inverter from './Inverter';
import CoolingSystems from './CoolingSystems';
import Batteries from './Batteries';
import SolarPanels from './SolarPanels';

import './App.css';

function App() {
  const [systemId, setSystemId] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    initialiseSimulation();
  }, []);

  const initialiseSimulation = async () => {
    if (systemId == '') {
      const simulation = await initDefault();
      setSystemId(simulation['result']['system_id']);
    }
  };

  return (
    <>
      {
        systemId === '' && (
          <div>
            <RingLoader
              color={'#ffffff'}
              loading={systemId === ''}
              cssOverride={{
                display: "block",
                margin: "0 auto",
                borderColor: "red",
              }}
              size={200}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
            <p style={{ color: 'white', paddingTop: 100, paddingLeft: 40, fontSize: 20 }}>Preparing Simulation...</p>
          </div>
        )
      }
      {
        systemId !== '' && (
          <div>
            <Dashboard systemId={systemId} active={active} setActive={setActive}/>
            <SimulationTimeSlider systemId={systemId} active={active} />
            <SolarArrayOutput systemId={systemId} active={active} />
            <Inverter systemId={systemId} active={active} />
            <CoolingSystems systemId={systemId} active={active} />
            <div style={{ width: '100%', textAlign: 'center', paddingBottom: 200 }}>
              <div style={{ width: 600, display: 'inline-block' }}>
              </div>
              <div style={{ width: 600, display: 'inline-block' }}>
              </div>
              <div style={{ width: '50%', display: 'inline-block', verticalAlign: 'top' }}>
                <Batteries systemId={systemId} active={active} />
              </div>
              <div style={{ width: '50%', display: 'inline-block', verticalAlign: 'top' }}>
                <SolarPanels systemId={systemId} active={active} />
              </div>
            </div>
          </div>
        )
      }
    </>
  )
}

export default App
