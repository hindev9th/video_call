export async function getXirsysIceServers() {
  try {
    const response = await fetch('https://global.xirsys.net/_turn/MyFirstApp', {
      method: 'PUT',
      headers: {
        'Authorization': 'Basic ' + btoa('hindev9th:7e6b2f8c-bdc4-11ef-add9-0242ac130002')
      }
    });
    const data = await response.json();
    return data.v.iceServers;
  } catch (error) {
    console.error('Error fetching Xirsys ICE servers:', error);
    return [];
  }
}