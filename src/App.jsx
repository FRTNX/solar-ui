import { useState, useEffect, PureComponent } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import BatteryGauge from 'react-battery-gauge';
import {
  LineChart,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Sector,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { initDefault, fetchPVSystem } from './api/solar-api'


function App() {
  const [active, setActive] = useState(true)
  const [systemId, setSystemId] = useState('');
  const [systemData, setSystemData] = useState([]);
  const [systemTime, setSystemTime] = useState('')

  const [batteryArrayPower, setBatteryArrayPower] = useState(0);
  const [batteries, setBatteries] = useState([]);
  const [displayBatteries, setDisplayBatteries] = useState(true);

  const [solarArrayOutput, setSolarArrayOutput] = useState(0);
  const [panels, setPanels] = useState([]);

  useEffect(() => {
    async function init() {
      await initialiseDefaultSimulation();
    }
    init();
  }, [])

  useEffect(() => {
    const interval = setInterval(() => updateSystemDetails(), 2000);

    if (!active) {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    }
  }, [systemId, active])

  const updateSystemDetails = async () => {
    if (systemId && active) {
      const system = await fetchPVSystem(systemId);
      setBatteryArrayPower(system['result']['battery_array_soc'] * 100)
      setSolarArrayOutput(system['result']['total_solar_output'])
      setSystemData(system['result']['time_series'])
      setSystemTime(system['result']['datetime'])
      setPanels(system['result']['panels'])
      setBatteries(system['result']['batteries'])
      setActive(system['result']['active'])
    }
  };

  const initialiseDefaultSimulation = async () => {
    if (!systemId) {
      const defaultSimulation = await initDefault();
      const sysId = defaultSimulation['result']['system_id']
      console.log('got default sim: ', sysId)
      await setSystemId(sysId)
    }
  }

  const toggleBatteries = () => {
    // if (displayBatteries) {
    //   setDisplayBatteries(false);
    // } else {
    //   setDisplayBatteries(true);
    // }
  };

  const toggleBattery = (id) => {
    // const batteryDetails = batteries;
    // batteryDetails.map((battery) => {
    //   if (battery.id === id) {
    //     if (battery.chart) {
    //       battery.chart = false;
    //     } else {
    //       battery.chart = true
    //     }
    //   }
    // });
    // console.log('battery details: ', batteryDetails)
    // setBatteries(current => [...batteryDetails]);
    // setDisplayBatteries(true)
  }

  return (
    <>
      <div>
        <div>
          <p>
            {systemTime}
          </p>
        </div>
        <div>
          {
            systemData.length > 0 && (
              <div>
                <ResponsiveContainer width='100%' height={200}>
                  <AreaChart data={systemData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <Area type="monotone" dataKey="solar_array_output" stroke="#8884d8" />
                    <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                    <XAxis />
                    <YAxis />
                    <Tooltip />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )
          }
        </div>
        <BatteryGauge style={{ width: '50%', display: 'inline-block' }} value={batteryArrayPower} size={200} />
      </div>
      <div style={{ width: '100%', textAlign: 'center' }}>
        <div style={{ width: 600, display: 'inline-block' }}>
        </div>
        <div style={{ width: 600, display: 'inline-block' }}>
        </div>
        <div style={{ width: '50%', display: 'inline-block', verticalAlign: 'top' }} onClick={() => toggleBatteries()}>
          <button style={{ width: '100%' }} type={'button'}>
            <p style={{ width: '50%', display: 'inline-block' }}>Battery Array</p>
          </button>
          {
            displayBatteries && (
              <div>
                {
                  batteries.map((battery, index) => (
                    <div key={index}>
                      <button style={{ width: '100%' }} type={'button'} onClick={() => toggleBattery(battery.id)}>
                        <p style={{ width: '30%', display: 'inline-block' }}>{'Battery '}{index+1}</p>
                        <p style={{ width: '10%', display: 'inline-block' }}>{battery.capacity} V</p>
                        <p style={{ width: '10%', display: 'inline-block' }}>{battery.amps} aH</p>
                        <BatteryGauge style={{ width: '50%', display: 'inline-block' }} value={battery['soc'] * 100} size={50} />
                      </button>
                      {
                        battery['time_series'] && (
                          <div style={{ width: '100%' }}>
                            <ResponsiveContainer width='100%' height={200}>
                              <LineChart data={battery['time_series']} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                <Line type="monotone" dataKey='available_power' stroke="#8884d8" />
                                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                                <XAxis />
                                <YAxis />
                                <Tooltip />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )
                      }
                    </div>
                  ))
                }
              </div>
            )
          }
        </div>
        <div style={{ width: '50%', display: 'inline-block', verticalAlign: 'top' }} onClick={() => toggleBatteries()}>
          <button style={{ width: '100%' }} type={'button'}>
            <p style={{ width: '50%', display: 'inline-block' }}>Solar Array</p>
          </button>
          {
            displayBatteries && (
              <div>
                {
                  panels.map((panel, index) => (
                    <div key={index}>
                      <button style={{ width: '100%' }} type={'button'} onClick={() => toggleBattery(battery.id)}>
                        {/* <p style={{ width: '30%', display: 'inline-block' }}>{panel['panel_id']}</p> */}
                        <p style={{ width: '20%', display: 'inline-block' }}>{'Solar Panel '}{index+1}</p>
                        <p style={{ width: '10%', display: 'inline-block' }}>{panel.rating} W</p>
                        <p style={{ width: '20%', display: 'inline-block' }}>{Number(panel['output']).toFixed(2)} W</p>
                      </button>
                      {
                        panel['time_series'] && (
                          <div style={{ width: '100%' }}>
                            <ResponsiveContainer width='100%' height={200}>
                              <LineChart data={panel['time_series']} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                <Line type="monotone" dataKey="power_output" stroke="#8884d8" />
                                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                                <XAxis label={'watts'}/>
                                <YAxis />
                                <Tooltip />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )
                      }
                    </div>
                  ))
                }
              </div>
            )
          }
        </div>
      </div>
    </>
  )
}

export default App
