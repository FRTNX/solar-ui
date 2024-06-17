import { useState, useEffect } from 'react'
import { RingLoader } from 'react-spinners';
import BatteryGauge from 'react-battery-gauge';

import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

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
import Switch from 'react-switch';
import ReactSlider from 'react-slider';

import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/slide.css';

import SolarPanelModal from './PanelModal';
import BatteryModal from './BatteryModal';

import {
  initDefault,
  fetchPVSystem,
  updateSystemIterations,
  updateCoolingSystem,
  removePVPanel,
  removePVBattery,
  updateMetadata
} from './api/solar-api';

import './App.css'

import styled from 'styled-components';

const override = {
  display: "block",
  margin: "0 auto",
  borderColor: "red",
};

const StyledSlider = styled(ReactSlider)`
    width: 100%;
    height: 10px;
`;

const StyledThumb = styled.div`
    height: 30px;
    line-height: 30px;
    width: 30px;
    top: -10px;
    text-align: center;
    background-color: grey;
    color: #fff;
    border-radius: 50%;
    border: none;
    cursor: grab;
`;

const Thumb = (props, state) => <StyledThumb {...props}>{state.valueNow}</StyledThumb>;

const StyledTrack = styled.div`
    top: 0;
    bottom: 0;
    background: ${props => (props.index === 2 ? '#f00' : props.index === 1 ? '#ddd' : '#0f0')};
    border-radius: 999px;
`;

const Track = (props, state) => <StyledTrack {...props} index={state.index} />;

const PATH_TRANSITION_DURATION = 1.5;
const META_ALGORITHM = false;

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">
    <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
  </svg>
)


function App() {
  const [active, setActive] = useState(true)
  const [systemId, setSystemId] = useState('');
  const [systemData, setSystemData] = useState([]);

  const [systemTime, setSystemTime] = useState('');
  const [temperature, setTemperature] = useState(0);

  const [batteryArrayPower, setBatteryArrayPower] = useState(0);
  const [batteries, setBatteries] = useState([]);

  const [solarIrradiance, setSolarIrradiance] = useState(0);
  const [solarArrayOutput, setSolarArrayOutput] = useState(0);
  const [maxSolarOutput, setMaxSolarOutput] = useState(1000);
  const [aggrSolarOutput, setAggrSolarOutput] = useState(0);

  const [panels, setPanels] = useState([]);
  const [inverterData, setInverterData] = useState({ time_series: [] });

  const [coolingSystems, setCoolingSystems] = useState([]);
  const [localCooling, setLocalCooling] = useState(true);
  const [serverCooling, setServerCooling] = useState(true);

  const [iterations, setIterations] = useState(252);
  const [minIterations, setMinIterations] = useState(1);
  const [updatingIter, setUpdatingIter] = useState(false);

  const [statsLeft, setStatsLeft] = useState(140);

  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ]);

  useEffect(() => {
    const handleWindowResize = () => {
      if (window, innerWidth < 1400) {
        const diff = Math.abs(140 - (window.innerWidth / 10)) + 50;
        setStatsLeft(140 - diff)
      } else {
        setStatsLeft(140)
      }
      setWindowSize([window.innerWidth, window.innerHeight]);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  useEffect(() => {
    async function init() {
      await initialiseDefaultSimulation();
    }
    init();
  }, [])

  useEffect(() => {
    const interval = setInterval(() => updateSystemDetails(), 1500);

    if (!active) {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    }
  }, [systemId, active]);

  const updateSystemDetails = async () => {
    if (systemId && active) {
      const system = await fetchPVSystem({ system_id: systemId });
      setBatteryArrayPower(system['result']['battery_array_soc'] * 100)
      setSolarArrayOutput(system['result']['total_solar_output'])
      setSystemData(current => {
        if (current.length === 0 || !META_ALGORITHM) {
          return system['result']['time_series']
        }
        return [...current, ...system['result']['time_series']]
      });
      setSystemTime(system['result']['datetime'])
      setPanels(current => {
        if (current.length === 0 || !META_ALGORITHM) {
          return system['result']['panels'];
        }
        const updatedPanels = [];
        system['result']['panels'].map((incomingPanel) => {
          let found = false;
          current.map((existingPanel) => {
            if (existingPanel['panel_id'] === incomingPanel['panel_id']) {
              const lastIndex = existingPanel['time_series'][existingPanel['time_series'].length - 1]['index']
              let startSlice;
              incomingPanel['time_series'].map((data, index) => {
                if (data['index'] === lastIndex + 1) { startSlice = index }
              });
              if (!startSlice) { console.log('BAD SEQUENCE') }
              const contiguousSequence = incomingPanel['time_series'].slice(startSlice)
              updatedPanels.push({
                ...incomingPanel,
                time_series: [...existingPanel['time_series'], ...contiguousSequence]
              });
              found = true;
            }
          })
          if (!found) {     // this means this is a new panel
            updatedPanels.push(incomingPanel)
          }
        })
        return updatedPanels;
      });

      setBatteries(current => {
        if (current.length === 0 || !META_ALGORITHM) {
          return system['result']['batteries'];
        }
        const updatedBatteries = [];
        system['result']['batteries'].map((incomingBattery) => {
          let found = false;
          current.map((existingBattery) => {
            if (existingBattery['battery_id'] === incomingBattery['battery_id']) {
              updatedBatteries.push({
                ...incomingBattery,
                time_series: [...existingBattery['time_series'], ...incomingBattery['time_series']]
              });
              found = true;

            }
          })
          if (!found) {    // new battery
            updatedBatteries.push(incomingBattery);
          }
        })
        return updatedBatteries;
      })

      setActive(system['result']['active'])
      setTemperature(system['result']['temperature'])
      setSolarIrradiance(system['result']['solar_irradiance'])
      setInverterData(current => {
        if (current['time_series'].length === 0 || !META_ALGORITHM) {
          return system['result']['inverter'];
        }
        const lastIndex = current['time_series'][current['time_series'].length - 1]['index']
        let startSlice;
        system['result']['inverter']['time_series'].map((data, index) => {
          if (data['index'] === lastIndex + 1) { startSlice = index }
        });
        if (!startSlice) { console.log('BAD SEQUENCE') }
        const contiguousSequence = system['result']['inverter']['time_series'].slice(startSlice)
        return {
          ...system['result']['inverter'],
          time_series: [...current['time_series'], ...contiguousSequence]
        }
      })
      setCoolingSystems(current => {
        if (current.length === 0 || !META_ALGORITHM) {
          return system['result']['cooling_systems'];
        }
        const updatedCooling = [];
        system['result']['cooling_systems'].map((incomingCooling) => {
          let found = false;
          current.map((existingCooling) => {
            if (existingCooling['panel_id'] === incomingCooling['panel_id']) {
              updatedCooling.push({
                ...incomingCooling,
                time_series: [...existingCooling['time_series'], ...incomingCooling['time_series']]
              });
              found = true;
            }
          })
          if (!found) {
            updatedCooling.push(incomingCooling);
          }
        })
        return updatedCooling;
      });
      setServerCooling(system['result']['panel_cooling']);
      setMaxSolarOutput(system['result']['max_solar_output']);
      setAggrSolarOutput(system['result']['aggregated_solar_output']);
      setMinIterations(system['result']['current_iteration']);
      setIterations(system['result']['max_iteration']);
      if (META_ALGORITHM) {
        acknowledgeMetadata(system['result']);
      }
    }
  };

  const acknowledgeMetadata = async (data) => {
    const system = data['time_series'];
    const systemIndex = system[system.length - 1]['index'];
    const inverter = data['inverter']['time_series'];
    const inverterIndex = inverter[inverter.length - 1]['index'];
    const panelIndices = data['panels'].reduce((result, panel) => ({
      ...result,
      [panel['panel_id']]: panel['time_series'][panel['time_series'].length - 1]['index']
    }), {});
    const batteryIndices = data['batteries'].reduce((result, battery) => ({
      ...result,
      [battery['battery_id']]: battery['time_series'][battery['time_series'].length - 1]['index']
    }), {});
    const coolingIndices = data['cooling_systems'].reduce((result, cooling) => ({
      ...result,
      [cooling['panel_id']]: cooling['time_series'][cooling['time_series'].length - 1]['index']
    }), {});

    const metadata = {
      system_id: systemId,
      system: systemIndex,
      inverter: inverterIndex,
      panels: panelIndices,
      batteries: batteryIndices,
      cooling_systems: coolingIndices
    };

    await updateMetadata(metadata);
  }

  const initialiseDefaultSimulation = async () => {
    if (systemId == '') {
      const defaultSimulation = await initDefault();
      const sysId = defaultSimulation['result']['system_id']
      setSystemId(sysId);
    }
  }

  const getTimeEmoji = (hour) => {
    if (hour < 6 || hour >= 18) {
      return '🌛'
    }

    if (hour >= 6 && hour < 18) {
      return '🌤'
    }
  };

  const toggleBatteries = () => { };

  const toggleCoolingSystems = () => {
    if (localCooling) {
      setLocalCooling(false)
      updateCoolingSystem({ system_id: systemId, active: false })
    } else {
      setLocalCooling(true);
      updateCoolingSystem({ system_id: systemId, active: true })
    }
  };

  const removePanel = (panelId) => { removePVPanel(systemId, panelId) }

  const removeBattery = (batteryId) => { removePVBattery(systemId, batteryId) };

  const updateIterations = async (value) => {
    setUpdatingIter(true);
    await updateSystemIterations({
      system_id: systemId,
      value
    });
    setUpdatingIter(false);
  };

  return (
    <>
      {
        systemData.length === 0 && (
          <div>
            <RingLoader
              color={'#ffffff'}
              loading={systemData.length === 0}
              cssOverride={override}
              size={200}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
            <p style={{ color: 'white', paddingTop: 100, paddingLeft: 40, fontSize: 20 }}>Preparing Simulation...</p>
          </div>
        )
      }
      {
        systemData.length > 0 && (
          <div>
            <div>
              <div>
                {
                  systemData.length > 0 && (
                    <div>
                      <div style={{ width: '100%', textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', width: '50%', position: 'relative' }}>
                          <p style={{ fontSize: 100 }}>{systemTime.slice(11, 16)} {getTimeEmoji(Number(systemTime.slice(11, 13)))}</p>
                          <p style={{ position: 'absolute', top: 230, left: statsLeft }}>
                            {`Total Photovoltaic Output: ${Number(aggrSolarOutput / 1000).toFixed(2)} kW`}
                          </p>
                        </div>
                        <div style={{ display: 'inline-block', width: '50%' }}>
                          <div style={{ height: 150, width: 150, display: 'inline-block', padding: 10 }}>
                            <CircularProgressbarWithChildren
                              value={solarArrayOutput}
                              maxValue={maxSolarOutput}
                              styles={buildStyles({
                                textSize: '10px',
                                strokeLinecap: 'butt',
                                pathColor: 'yellow',
                                trailColor: 'grey',
                                textColor: 'white',
                                pathTransitionDuration: PATH_TRANSITION_DURATION
                              })}
                            >
                              <div>
                                <p style={{ fontSize: 11 }}>Solar Array Output</p>
                                <p>
                                  {`${Number(solarArrayOutput).toFixed(2)} W`}
                                </p>
                              </div>
                            </CircularProgressbarWithChildren>
                          </div>
                          <div style={{ height: 150, width: 150, display: 'inline-block', padding: 10 }}>
                            <CircularProgressbarWithChildren
                              value={solarIrradiance}
                              maxValue={1100}
                              styles={buildStyles({
                                textSize: '10px',
                                strokeLinecap: 'butt',
                                pathColor: 'yellow',
                                trailColor: 'grey',
                                textColor: 'white',
                                pathTransitionDuration: PATH_TRANSITION_DURATION
                              })}
                            >
                              <div>
                                <p style={{ fontSize: 11 }}>Solar Iraddiance</p>
                                <p>
                                  {`${Number(solarIrradiance).toFixed(2)} W/`}
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
                              value={temperature}
                              maxValue={40}
                              styles={buildStyles({
                                textSize: '10px',
                                strokeLinecap: 'butt',
                                pathColor: 'yellow',
                                trailColor: 'grey',
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
                      <div style={{ width: '100%' }}>
                        <StyledSlider
                          min={Number(minIterations / 84).toFixed(0)}
                          max={30}
                          defaultValue={[3]}
                          renderTrack={Track} renderThumb={Thumb}
                          onAfterChange={(value, index) =>
                            // console.log(`onAfterChange: ${JSON.stringify({ value, index })}`)
                            updateIterations(value)
                          }
                          disabled={updatingIter}
                        />
                        <p style={{ paddingTop: 5, color: 'grey' }}>{`Simulation Duration (${Number(iterations / 84).toFixed(0)} Days)`}</p>
                      </div>

                      <div>
                        <ResponsiveContainer width='100%' height={200}>
                          <AreaChart data={systemData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                            <Area
                              name='Total Solar Array Output (Watts)'
                              label={'Solar Array Output'}
                              type="monotone"
                              dataKey="solar_array_output"
                              stroke="#FFD700"
                              fill='#FFD700'
                              fillOpacity={0.65}
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
                              <p style={{ paddingTop: 30, fontSize: 30, color: 'grey' }}>Inverter</p>
                              <div style={{ width: '80%', display: 'inline-block' }}>
                                <ResponsiveContainer width='100%' height={200}>
                                  <AreaChart data={inverterData['time_series']} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                    <Area
                                      name='Inverter Output (Watts)'
                                      type="monotone"
                                      dataKey="output"
                                      stroke="#82ca9d"
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
                            <div style={{ width: '100%', textAlign: 'center', position: 'relative' }}>
                              <p style={{ paddingTop: 30, fontSize: 30, color: 'grey', display: 'inline-block' }}>Cooling Systems</p>
                              <label style={{ display: 'inline-block', position: 'absolute', top: 68, paddingLeft: 20 }}>
                                <Switch
                                  onChange={() => toggleCoolingSystems()}
                                  checked={localCooling}
                                  checkedIcon={false}
                                  uncheckedIcon={false}
                                  disabled={localCooling !== serverCooling}
                                />
                              </label>
                              <br />
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
            <div style={{ width: '100%', textAlign: 'center', paddingBottom: 200 }}>
              <div style={{ width: 600, display: 'inline-block' }}>
              </div>
              <div style={{ width: 600, display: 'inline-block' }}>
              </div>
              <div style={{ width: '50%', display: 'inline-block', verticalAlign: 'top' }} onClick={() => toggleBatteries()}>
                <div style={{ width: '100%', backgroundColor: '#1a1a1a' }}>
                  <p style={{ width: '50%', display: 'inline-block' }}>Battery Array</p>
                </div>

                <div>
                  {
                    batteries.map((battery, index) => (
                      <div key={index}>
                        <div style={{ width: '100%', height: 60, backgroundColor: '#1a1a1a', position: 'relative' }}>
                          <p style={{ display: 'inline-block' }}>{'Battery '}{index + 1}</p>
                          <p style={{ display: 'inline-block', paddingLeft: 20 }}>{battery.capacity} V</p>
                          <p style={{ display: 'inline-block', paddingLeft: 20 }}>{battery.amps} Ah</p>
                          <p style={{ display: 'inline-block', paddingLeft: 20, marginBottom: 10 }}>
                            <BatteryGauge style={{ display: 'inline-block', position: 'absolute', top: 14 }} value={battery['soc'] * 100} size={50} />
                            <div style={{ display: 'inline-block', position: 'absolute', right: '5px', top: '8px' }}>
                              <Menu
                                menuButton={<MenuButton><MenuIcon /></MenuButton>}
                                menuStyle={{ backgroundColor: '#323030', color: 'white' }}
                                key={`solar-panel-menu-${index}`}
                                direction={'left'}
                                transition
                              >
                                <MenuItem onClick={() => removeBattery(battery['battery_id'])}>Remove Battery</MenuItem>
                                <MenuItem>Battery Details</MenuItem>
                              </Menu>
                            </div>
                          </p>
                        </div>
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
                {systemData.length > 0 && (<BatteryModal systemId={systemId} />)}
              </div>
              <div style={{ width: '50%', display: 'inline-block', verticalAlign: 'top' }} onClick={() => toggleBatteries()}>
                <div style={{ width: '100%', backgroundColor: '#1a1a1a' }}>
                  <p style={{ width: '50%', display: 'inline-block' }}>Solar Array</p>
                </div>
                <div>
                  {
                    panels.map((panel, index) => (
                      <div key={index}>
                        <div style={{ width: '100%', height: 60, backgroundColor: '#1a1a1a', position: 'relative' }}>
                          <p style={{ display: 'inline-block' }}>{'Solar Panel '}{index + 1}</p>
                          <p style={{ display: 'inline-block', paddingLeft: 20 }}>{panel.rating} W</p>
                          <p style={{ display: 'inline-block', paddingLeft: 20 }}>{Number(panel['output']).toFixed(2)} W</p>
                          <p style={{ display: 'inline-block', paddingLeft: 20 }}>{`${Number(panel['temperature']).toFixed(1)} ℃`}</p>
                          <p style={{ display: 'inline-block', paddingLeft: 20 }}>{`${Number(panel['efficiency'] * 100).toFixed(1)} %`}</p>
                          <div style={{ display: 'inline-block', position: 'absolute', right: '5px', top: '8px' }}>
                            <Menu
                              menuButton={<MenuButton><MenuIcon /></MenuButton>}
                              menuStyle={{ backgroundColor: '#323030', color: 'white' }}
                              key={`solar-panel-menu-${index}`}
                              direction={'left'}
                              transition
                            >
                              <MenuItem onClick={() => removePanel(panel['panel_id'])}>Remove Panel</MenuItem>
                              <MenuItem>Panel Details</MenuItem>
                            </Menu>
                          </div>
                        </div>
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
                {systemData.length > 0 && (<SolarPanelModal systemId={systemId} />)}
              </div>
            </div>
          </div>
        )
      }
    </>
  )
}

export default App
