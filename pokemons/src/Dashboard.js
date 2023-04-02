
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from "jwt-decode";

function Dashboard({accessToken, setAccessToken, refreshToken}) {
  const [admin, setAdmin] = useState(null)
  const axiosJWT = axios.create()
  axiosJWT.interceptors.request.use(
    async (config) => {
      const decodedToken = jwt_decode(accessToken);
      if (decodedToken.exp < Date.now() / 800) {
        const res = await axios.get("http://localhost:6001/requestNewAccessToken", {
          headers: {
            'auth-token-refresh': refreshToken
          }
        });
        setAccessToken(res.headers['auth-token-access'])
        config.headers["auth-token-access"] = res.headers['auth-token-access'];
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  useEffect(() => {
    async function fetchTypes() {
      const res = await axiosJWT.get('http://localhost:6001/report', {
        headers: {
          'auth-token-access': accessToken
        }
      });
      console.log(res.data)
      setAdmin(res.data)
    }
    fetchTypes();
  }, []);
  return (
    <div>
      <h1>Dashboard</h1>
      <h1>{admin}</h1>
    </div>
  )
}

export default Dashboard