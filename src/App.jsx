import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import BatteryGauge from 'react-battery-gauge';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, CartesianAxis } from 'recharts';

const data = [
  { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 300, pv: 2400, amt: 2400 },
  { name: 'Page C', uv: 111, pv: 2400, amt: 2400 },
  { name: 'Page D', uv: 344, pv: 2400, amt: 2400 },
  { name: 'Page E', uv: 222, pv: 2400, amt: 2400 },
  { name: 'Page F', uv: 317, pv: 2400, amt: 2400 },
  { name: 'Page G', uv: 377, pv: 2400, amt: 2400 },
  { name: 'Page H', uv: 177, pv: 2400, amt: 2400 }
];


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <div>
        <BatteryGauge value={count} />
      </div>
      <div style={{ width: '100%', textAlign: 'center' }}>
        <div style={{ width: '50%', display: 'inline-block' }}>
          <LineChart width={600} height={200} data={data} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
            <Line type="monotone" dataKey="uv" stroke="#8884d8" />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
          </LineChart>
        </div>
        <div style={{ width: '50%', display: 'inline-block' }}>
          <LineChart width={600} height={200} data={data} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
            <Line type="monotone" dataKey="uv" stroke="#8884d8" />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
          </LineChart>
        </div>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <table style={{ width: 800, height: 200 }}>
            <tr>
              <th>Name</th>
              <th>UV</th>
              <th>PV</th>
              <th>Amount</th>
            </tr>
            {
              data.map((val, key) => {
                return (
                  <tr key={key}>
                    <td>{val.name}</td>
                    <td>{val.uv}</td>
                    <td>{val.pv}</td>
                    <td>{val.amt}</td>
                  </tr>
                )
              })
            }
          </table>
        </div>
      </div>
    </>
  )
}

export default App
