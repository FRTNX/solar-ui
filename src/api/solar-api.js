const BASE_URL = 'https://solar-ui.onrender.com';
// const BASE_URL = 'http://localhost:8001'

const initDefault = async () => {
    try {
        const response = await fetch(`${BASE_URL}:8001/pv/init/default`, {
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
}

export {
    initDefault,
    fetchPVSystem
}