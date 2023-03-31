import React from 'react'
import { useState} from 'react'
import axios from 'axios'
import {Link } from "react-router-dom";
import "./Form.css"
import Dashboard from './Dashboard';
import Pokemons from './pokemons';

const Login = () => {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.post("http://localhost:6001/login", { username, password });
    console.log(res.data)
    setUser(res.data);
    setAccessToken(res.headers['auth-token-access']);
    setRefreshToken(res.headers['auth-token-refresh']);
  }

  return (
    <div>
      {(user) && 
        <div>
            <h1>Welcome {user.username}</h1>
          {(user.role =="admin") &&
           <Dashboard accessToken={accessToken} setAccessToken={setAccessToken} refreshToken={refreshToken} />
        }
        {(user.role =="user") &&
           <Pokemons/>
        }
        </div>
      }
      {(!user)&&
        <div id="form">
        <form onSubmit={handleSubmit}>
        <h1>Login</h1>
          <label>User Name</label>
          <input type="text" placeholder='Enter Username' onChange={(e)=>setUsername(e.target.value)}></input>
          <label>Password</label>
          <input type="text" placeholder='Enter password' onChange={(e)=>setPassword(e.target.value)}></input>
          <button type='submit'>Submit</button><br/><br/>
          <Link to="/register" variant = "body2" className="signup-link"> Not have an account ? Sign up here </Link>
        </form>
        </div>
      }
    </div>
  )
}

export default Login;
