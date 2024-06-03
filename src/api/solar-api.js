const BASE_URL = 'https://solar-sim.onrender.com';
// const BASE_URL = 'http://localhost:8001';

const initDefault = async () => {
    try {
        const response = await fetch(`${BASE_URL}/pv/init/default`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return await response.json()
    } catch (error) {
        console.log(error);
    }
};

const fetchPVSystem = async (systemId) => {
    try {
        const response = await fetch(`${BASE_URL}/pv/system?system_id=` + systemId , {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    } catch (error) {
        console.log(error);
    }
};

const updateCoolingSystem = async (params) => {
    try {
        const response = await fetch(`${BASE_URL}/pv/cooling/update`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        return await response.json();
    } catch (error) {
        console.log(error)
    }
};

const addPVPanel = async (params) => {
    try {
        const response = await fetch(`${BASE_URL}/pv/panel/add`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        return await response.json();
    } catch (error) {
        console.log(error)
    }
};

const removePVPanel = async (systemId, panelId) => {
    try {
        const response = await fetch(`${BASE_URL}/pv/panel/remove?system_id=${systemId}&&panel_id=${panelId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    } catch (error) {
        console.log(error)
    }
};

const addPVBattery = async (params) => {
    try {
        const response = await fetch(`${BASE_URL}/pv/battery/add`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        return await response.json();
    } catch (error) {
        console.log(error)
    }
};

const removePVBattery = async (systemId, batteryId) => {
    try {
        const response = await fetch(`${BASE_URL}/pv/battery/remove?system_id=${systemId}&&battery_id=${batteryId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    } catch (error) {
        console.log(error)
    }
}

export {
    initDefault,
    fetchPVSystem,
    updateCoolingSystem,
    addPVBattery,
    removePVBattery,
    addPVPanel,
    removePVPanel
};
