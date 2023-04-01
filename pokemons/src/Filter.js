import React, {useEffect, useState} from 'react'
import axios from 'axios';
import "./filter.css"
function Filter({types, setTypes, name, setName}) {
    const [alltypes, setAllTypes] = useState([])

    useEffect(()=>{
        async function fetchTypes(){
            const res = await axios.get('https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/types.json')
            setAllTypes(res.data.map(type => type.english))
        }
        fetchTypes()

    }, [])
    const handleChange= (e)=>{
        const {value, checked} = e.target
        if(checked){
            setTypes([...types, value])
        }
        else{
            const remainingTypes = types.filter(type => type !== value)
            setTypes(remainingTypes)
        }
    }
    const handleName = (e) =>{
        const name = e.target.value
        setName(name)
    }

  return (
    <div className='filter'>

        {   <div className='filter2'>
            <label className='label'>Filter By Name :</label>
            <input className='name' type="text" placeholder='eg: Pikachu' onChange={handleName}></input>
            </div>
        }
        {   <div className='label1'>
            <label id ="label3">Filter By type :</label><br></br>
            </div>
        }
        {
        alltypes.map(type =>
          <div className='filter1' key={type}>
            <label id="heading" htmlFor={type}>{type} </label><input className='name' type="checkbox" value={type} id={type} onChange={handleChange} />
          </div>)
      }
    </div>
  )
}

export default Filter