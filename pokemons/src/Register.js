import React from 'react'
import { useState , useEffect} from 'react'
import axios from 'axios'
import {Link, useNavigate } from "react-router-dom";
import "./Form.css"
const Register = () => {
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [email, setemail] = useState('');
const [user, setUser] = useState(null);
const navigate = useNavigate();
const handleSubmit = async (e) => {
  e.preventDefault();
  const res = await axios.post("https://pokedex-7dyg.onrender.com/register", { username, password, email});
  console.log(res.data)
  setUser(res.data);
}
useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  return (
    
    <div>
      {(!user)&&
       <div id="form">
    <form onSubmit={handleSubmit}>
    <h1>Register</h1>
          <label>User Name</label>
          <input type="text" placeholder='Enter Username' onChange={(e)=>setUsername(e.target.value)}></input>
          <label>Email</label>
          <input type="email" placeholder='Enter email' onChange={(e)=>setemail(e.target.value)}></input>
          <label>Password</label>
          <input type="text" placeholder='Enter password' onChange={(e)=>setPassword(e.target.value)}></input>
          <button type='submit'>Submit</button><br/><br/>
          <Link to="/" variant = "body2"className="signup-link"> Already have an account ? login in here</Link>
        </form>
        </div>
}
    </div>
      
  )
}

export default Register