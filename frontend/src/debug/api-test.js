// Simple script to test API endpoints
const axios = require('axios');

// Function to test the doctor patients endpoint
async function testDoctorPatientsEndpoint() {
  console.log('====== TESTING DOCTOR PATIENTS ENDPOINT ======');
  
  // Get token from localStorage (run this in browser console and paste token here)
  const token = ''; // Add your doctor token here
  
  try {
    console.log('Attempting to call /patients/doctor endpoint...');
    const response = await axios.get('http://localhost:8000/patients/doctor', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Success! Status Code:', response.status);
    console.log('Data received:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error calling /patients/doctor endpoint:');
    
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error('Status code:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Server might be down.');
      console.error('Request details:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Error message:', error.message);
    }
    
    return null;
  }
}

// Function to test the doctor prescriptions endpoint (for comparison)
async function testDoctorPrescriptionsEndpoint() {
  console.log('====== TESTING DOCTOR PRESCRIPTIONS ENDPOINT ======');
  
  // Get token from localStorage (run this in browser console and paste token here)
  const token = ''; // Add your doctor token here
  
  try {
    console.log('Attempting to call /prescriptions/doctor endpoint...');
    const response = await axios.get('http://localhost:8000/prescriptions/doctor', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Success! Status Code:', response.status);
    console.log('Data received:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error calling /prescriptions/doctor endpoint:');
    
    if (error.response) {
      console.error('Status code:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received.');
      console.error('Request details:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    return null;
  }
}

// Main function to run tests
async function runTests() {
  await testDoctorPatientsEndpoint();
  console.log('\n');
  await testDoctorPrescriptionsEndpoint();
}

// Run the tests
runTests();