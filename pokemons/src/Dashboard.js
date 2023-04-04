
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from "jwt-decode";
import { Bar, Line } from 'react-chartjs-2';
import "./dashboard.css"
import moment from 'moment'
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);


function Dashboard({accessToken, setAccessToken, refreshToken}) {
  const [uniqueUsersData, setUniqueUsersData] = useState(null);
  const [topUsersData, setTopUsersData] = useState(null);
  const [topEndpointUsersData, setTopEndpointUsersData] = useState(null);
  const [errorsByEndpointData, setErrorsByEndpointData] = useState(null);
  const [recentErrorsData, setRecentErrorsData] = useState(null);

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const decodedToken = jwt_decode(accessToken);
      if (decodedToken.exp < Date.now() / 1000) {
        const res = await axios.get("http://localhost:6001/requestNewAccessToken", {
          headers: {
            'auth-token-refresh': refreshToken
          }
        });
        setAccessToken(res.headers['auth-token-access']);
        config.headers["auth-token-access"] = res.headers['auth-token-access'];
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    async function fetchReportsData() {
      console.log("hello")
        const uniqueUsersRes = await axiosJWT.get('http://localhost:6001/unique-users-over-time', {
          headers: {
            'auth-token-access': accessToken
          },
        });
       
        setUniqueUsersData(uniqueUsersRes.data);

        const topUsersRes = await axiosJWT.get('http://localhost:6001/top-users-over-time', {
          headers: {
            'auth-token-access': accessToken
          },
        });
        setTopUsersData(topUsersRes.data);

        const topEndpointUsersRes = await axiosJWT.get('http://localhost:6001/top-users-by-endpoint', {
          headers: {
            'auth-token-access': accessToken
          },
        });
        setTopEndpointUsersData(topEndpointUsersRes.data);

        const errorsByEndpointRes = await axiosJWT.get('http://localhost:6001/4xx-errors-by-endpoint', {
          headers: {
            'auth-token-access': accessToken
          },
        });
        setErrorsByEndpointData(errorsByEndpointRes.data);

        const recentErrorsRes = await axiosJWT.get('http://localhost:6001/4xx-5xx-errors', {
          headers: {
            'auth-token-access': accessToken
          },
          params: {
            limit: 10
          }
        });
        console.log( recentErrorsRes.data)
        setRecentErrorsData(recentErrorsRes.data)
      }
    fetchReportsData();
    
    }, []);
    const chartData = {
      labels: uniqueUsersData?.map(dataPoint => moment(dataPoint.date).format('H') + ':00'),
      datasets: [
        {
          label: 'Unique API Users Over Time',
          data: uniqueUsersData?.map(dataPoint => dataPoint.uniqueUsersCount),
          backgroundColor: '#043056e3',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ],
    };
    const chartData2 = {
      labels: topUsersData?.map(dataPoint => dataPoint.username),
      datasets: [
        {
          label: 'Top api users',
          data: topUsersData?.map(dataPoint => dataPoint.requests),
          backgroundColor: '#043056e3',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };

    const chartData3 = {
      labels: errorsByEndpointData?.map(dataPoint => dataPoint.endpoint),
      datasets: [
        {
          label: '4XX errors by endpoints',
          data: errorsByEndpointData?.map(dataPoint => dataPoint.count),
          backgroundColor: '#043056e3',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };
    const options = {
      scales: {
        x:{
          title:{
            display:true,
            text: "Time of the day",
            color:'#043056e3'
          }
        },
        y:{
          title:{
            display:true,
            text: "Count of unique users",
            color:'#043056e3'
          }
        }
      }
    }
    const options1 = {
      scales: {
        x:{
          title:{
            display:true,
            text: "UserName",
            color:'#043056e3'
          }
        },
        y:{
          title:{
            display:true,
            text: "total request made",
            color:'#043056e3'
          }
        }
      }
    }
    const options2 = {
      scales: {
        x:{
          title:{
            display:true,
            text: "Endpoint",
            color:'#043056e3'
          }
        },
        y:{
          title:{
            display:true,
            text: "Count of Errors",
            color:'#043056e3'
          }
        }
      }
    }
    function ReportTable({ data }) {
      return (
        <table>
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Username</th>
              <th>Requests</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row, index) => (
              <tr key={index}>
                <td>{row.endpoint}</td>
                <td>
                  <ul>
                    {row.topUsers.map((user, index) => (
                      <li key={index}>{user.username}</li>
                    ))}
                  </ul>

                </td>
                <td>
                  <ul>
                    {row.topUsers.map((user, index) => (
                      <li key={index}>{user.requests}</li>
                    ))}
                  </ul>
                  
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    return (
      <div className="dashboard-container">
        <h1>Let's Explore user's activity</h1>
        
        <div className="chart-grid">
          <div className="chart-card">
            <h2>Unique API Users Over Time</h2>
            <Line data={chartData}  options={options}/>
          </div>
          <div className="chart-card">
            <h2>Top users for each Endpoint</h2>
            <ReportTable data={topEndpointUsersData}/>
          </div>
          <div className="chart-card">
            <h2>Top API users over period of time</h2>
            <Bar data={chartData2} options={options1} />
          </div>
          <div className="chart-card">
            <h2>4xx Errors By Endpoint</h2>
            <Bar data ={chartData3} options={options1} />
          </div>
        </div>
        
        <div className="table-card">
          <h2>Recent 4xx/5xx Endpoint Errors</h2>
          <table>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Status Code</th>
                <th>Failed Requests</th>
              </tr>
            </thead>
            <tbody>
              {recentErrorsData?.map((data, index) => (
                <tr key={index}>
                  <td>{data.endpoint}</td>
                  <td>{data.status_code}</td>
                  <td>
                    {data.failed_requests.length > 0 ? (
                      <ul>
                        {data.failed_requests.map((request, index) => (
                          <li key={index}>{new Date(request.timestamp).toLocaleString()}</li>
                        ))}
                      </ul>
                    ) : (
                      0
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    
      </div>
    )
    
    
}

export default Dashboard