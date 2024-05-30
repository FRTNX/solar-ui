import { useState, useEffect } from 'react'
import BatteryGauge from 'react-battery-gauge';
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';

import {
  LineChart,
  AreaChart,
  Area,
  Line,
  Legend,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import GaugeChart from 'react-gauge-chart';

import { initDefault, fetchPVSystem } from './api/solar-api'

import './App.css'
import 'react-circular-progressbar/dist/styles.css';


const PATH_TRANSITION_DURATION = 2;


function App() {
  const [active, setActive] = useState(true)
  const [systemId, setSystemId] = useState('');
  const [systemData, setSystemData] = useState([]);

  const [systemTime, setSystemTime] = useState('');
  const [temperature, setTemperature] = useState(0);

  const [batteryArrayPower, setBatteryArrayPower] = useState(0);
  const [batteries, setBatteries] = useState([]);
  const [displayBatteries, setDisplayBatteries] = useState(true);

  const [solarIrradiance, setSolarIrradiance] = useState(0);
  const [solarArrayOutput, setSolarArrayOutput] = useState(0);
  const [panels, setPanels] = useState([]);

  const [inverterData, setInverterData] = useState({})
  const [coolingSystems, setCoolingSystems] = useState([])

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
    console.log('system id: ', systemId)

    if (systemId && active) {
      const system = await fetchPVSystem(systemId);
      console.log('system details: ', system);
      console.log('data:', system['result']['time_series'])
      setBatteryArrayPower(system['result']['battery_array_soc'] * 100)
      setSolarArrayOutput(system['result']['total_solar_output'])
      setSystemData(system['result']['time_series'])
      setSystemTime(system['result']['datetime'])
      setPanels(system['result']['panels'])
      setBatteries(system['result']['batteries'])
      setActive(system['result']['active'])
      setTemperature(system['result']['temperature'])
      setSolarIrradiance(system['result']['solar_irradiance'])
      setInverterData(system['result']['inverter'])
      setCoolingSystems(system['result']['cooling_systems'])
    }
  };

  const initialiseDefaultSimulation = async () => {
    if (systemId == '') {
      const defaultSimulation = await initDefault();
      const sysId = defaultSimulation['result']['system_id']
      console.log('got default sim: ', sysId)
      setSystemId(sysId)
    }
  }

  const getTimeEmoji = (hour) => {
    if (hour < 6 || hour >= 18) {
      return '🌛'
    }

    if (hour >= 6 && hour < 18) {
      return '🌤'
    }
  }

  const toggleBatteries = () => { };

  const toggleBattery = (id) => { }

  return (
    <>
      <div>
        <div>
          {
            systemData.length > 0 && (
              <div>
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', width: '50%' }}>
                    <p style={{ fontSize: 100 }}>{systemTime.slice(11, 16)} {getTimeEmoji(Number(systemTime.slice(11, 13)))}</p>
                  </div>
                  <div style={{ display: 'inline-block', width: '50%' }}>
                    <div style={{ height: 150, width: 150, display: 'inline-block', padding: 10 }}>
                      <CircularProgressbarWithChildren
                        value={solarArrayOutput}
                        maxValue={500}
                        styles={buildStyles({
                          textSize: '10px',
                          strokeLinecap: 'butt',
                          pathColor: 'green',
                          textColor: 'white',
                          pathTransitionDuration: PATH_TRANSITION_DURATION
                        })}
                      >
                        <div>
                          <p style={{ fontSize: 11 }}>Solar Array Output</p>
                          <p>
                            {`${Number(solarArrayOutput).toFixed(2)} W/`}
                            <math>
                              <msup>
                                <mi>m</mi>
                                <mn>2</mn>
                              </msup>
                            </math>
                          </p>
                        </div>
                      </CircularProgressbarWithChildren>
                    </div>
                    <div style={{ height: 150, width: 150, display: 'inline-block', padding: 10 }}>
                      <CircularProgressbarWithChildren
                        value={solarIrradiance}
                        maxValue={1000}
                        styles={buildStyles({
                          textSize: '10px',
                          strokeLinecap: 'butt',
                          pathColor: 'green',
                          textColor: 'white',
                          pathTransitionDuration: PATH_TRANSITION_DURATION
                        })}
                      >
                        <div>
                          <p style={{ fontSize: 11 }}>Solar Iraddiance</p>
                          <p>{`${Number(solarIrradiance).toFixed(2)} W`}</p>
                        </div>
                      </CircularProgressbarWithChildren>
                    </div>
                    <div style={{ height: 150, width: 150, display: 'inline-block', padding: 10 }}>
                      <CircularProgressbarWithChildren
                        value={temperature}
                        maxValue={40}
                        styles={buildStyles({
                          textSize: '10px',
                          strokeLinecap: 'butt',
                          pathColor: 'green',
                          textColor: 'white',
                          pathTransitionDuration: PATH_TRANSITION_DURATION
                        })}
                      >
                        <div>
                          <p style={{ fontSize: 11 }}>Temperature</p>
                          <p>{`${Number(temperature).toFixed(1)} ℃`}<math></math></p>
                        </div>
                      </CircularProgressbarWithChildren>
                    </div>
                  </div>
                </div>
                <div>
                  <ResponsiveContainer width='100%' height={200}>
                    <AreaChart data={systemData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                      <Area
                        name='Total Solar Array Output (Watts)'
                        label={'Solar Array Output'}
                        type="monotone"
                        dataKey="solar_array_output"
                        stroke="#133113"
                        fill='#8291cd'
                        fillOpacity={1}
                      />
                      <CartesianGrid stroke="grey" strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend formatter={(value, entry, index) => <span style={{ color: 'grey' }}>{value}</span>} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  {
                    inverterData && (
                      <div style={{ width: '100%', textAlign: 'center' }}>
                        <p style={{ paddingTop: 30, fontSize: 30, color: 'grey' }}>Inverter Details</p>
                        <div style={{ width: '80%', display: 'inline-block' }}>
                          <ResponsiveContainer width='100%' height={200}>
                            <AreaChart data={inverterData['time_series']} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                              <Area
                                name='Inverter Output (Watts)'
                                type="monotone"
                                dataKey="output"
                                stroke="grey"
                                fill='#82ca9d'
                                fillOpacity={0.8}
                              />
                              <CartesianGrid stroke="grey" strokeDasharray="3 3" />
                              <XAxis />
                              <YAxis />
                              <Tooltip />
                              <Legend formatter={(value, entry, index) => <span style={{ color: 'grey' }}>{value}</span>} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ width: '20%', display: 'inline-block', verticalAlign: 'top', paddingTop: 40 }}>
                          <GaugeChart
                            id='gc-1'
                            nrOfLevels={30}
                            percent={inverterData['output'] / inverterData['max_output']}
                          />
                          <p style={{ color: 'grey' }}>Inverter Load</p>
                        </div>
                      </div>
                    )
                  }
                </div>
                <div>
                  {
                    coolingSystems.length > 0 && (
                      <div style={{ width: '100%', textAlign: 'center' }}>
                        <p style={{ paddingTop: 30, fontSize: 30, color: 'grey' }}>Cooling Systems</p>
                        {
                          coolingSystems.map((coolingSystem, index) => (
                            <div style={{ width: '50%', display: 'inline-block' }}>
                              <ResponsiveContainer width='100%' height={200}>
                                <LineChart data={coolingSystem['time_series']} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                  <Line name='Cooling System Output (℃)' type="monotone" dataKey='output' stroke="#8884d8" />
                                  <CartesianGrid stroke="grey" strokeDasharray="3 3" />
                                  <XAxis />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend formatter={(value, entry, index) => <span style={{ color: 'grey' }}>{value}</span>} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ))
                        }
                      </div>
                    )
                  }
                </div>
              </div>
            )
          }
        </div>
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
                        <p style={{ display: 'inline-block' }}>{'Battery '}{index + 1}</p>
                        <p style={{ display: 'inline-block', paddingLeft: 20 }}>{battery.capacity} V</p>
                        <p style={{ display: 'inline-block', paddingLeft: 20 }}>{battery.amps} Ah</p>
                        <BatteryGauge style={{ width: '50%', display: 'inline-block' }} value={battery['soc'] * 100} size={50} />
                      </button>
                      {
                        battery['time_series'] && (
                          <div style={{ width: '100%' }}>
                            <ResponsiveContainer width='100%' height={200}>
                              <LineChart data={battery['time_series']} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                <Line name='Available Battery Power' type="monotone" dataKey='available_power' stroke="#8884d8" />
                                <CartesianGrid stroke="grey" strokeDasharray="3 3" />
                                <XAxis />
                                <YAxis />
                                <Tooltip />
                                <Legend formatter={(value, entry, index) => <span style={{ color: 'grey' }}>{value}</span>} />
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
                        <p style={{ display: 'inline-block' }}>{'Solar Panel '}{index + 1}</p>
                        <p style={{ display: 'inline-block', paddingLeft: 20 }}>{panel.rating} W</p>
                        <p style={{ display: 'inline-block', paddingLeft: 20 }}>{Number(panel['output']).toFixed(2)} W</p>
                        <p style={{ display: 'inline-block', paddingLeft: 20 }}>{`${Number(panel['temperature']).toFixed(1)} ℃`}</p>
                        <p style={{ display: 'inline-block', paddingLeft: 20 }}>{`${Number(panel['efficiency'] * 100).toFixed(1)} %`}</p>
                      </button>
                      {
                        panel['time_series'] && (
                          <div style={{ width: '100%' }}>
                            <ResponsiveContainer width='100%' height={200}>
                              <LineChart data={panel['time_series']} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                <Line name="Solar Panel Output (Watts)" type="monotone" dataKey="power_output" stroke="#8884d8" />
                                <CartesianGrid stroke="grey" strokeDasharray="3 3" />
                                <XAxis />
                                <YAxis />
                                <Tooltip />
                                <Legend formatter={(value, entry, index) => <span style={{ color: 'grey' }}>{value}</span>} />
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
